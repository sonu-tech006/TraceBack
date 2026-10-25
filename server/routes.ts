import { Router, Request, Response, NextFunction } from 'express';
import { db, User, Item, Claim, ItemStatus } from './db.js';
import { calculateMatchScore, computeMatches } from './matching.js';
import { analyzeItemDescription, explainMatch } from './ai.js';
import crypto from 'crypto';

export const apiRouter = Router();

// Simple JWT/Token session map
const activeTokens = new Map<string, { userId: string; role: string; expires: number }>();

function generateToken(user: User): string {
  const token = crypto.randomBytes(32).toString('hex');
  activeTokens.set(token, {
    userId: user.id,
    role: user.role,
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  });
  return token;
}

// Authentication middleware
function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    (req as any).user = null;
    return next();
  }

  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  const session = activeTokens.get(token);
  if (session && session.expires > Date.now()) {
    const user = db.findUserById(session.userId);
    (req as any).user = user || null;
  } else {
    (req as any).user = null;
  }
  next();
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  if (!user) {
    return res.status(401).json({ error: 'Authentication required to perform this action' });
  }
  next();
}

apiRouter.use(authenticate);

// Health check
apiRouter.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    itemsCount: db.getItems().length,
    database: db.getDatabaseStatus(),
  });
});

// Database status & configuration endpoint
apiRouter.get('/database/status', (_req: Request, res: Response) => {
  res.json(db.getDatabaseStatus());
});

// ======================== AUTHENTICATION ========================

apiRouter.post('/auth/register', (req: Request, res: Response) => {
  const { name, email, password, organization, phone } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  const existing = db.findUserByEmail(email);
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists' });
  }

  const newUser: User = {
    id: `usr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    passwordHash: db.hashPassword(password),
    role: 'user',
    organization: organization?.trim() || 'Community Member',
    phone: phone?.trim() || '',
    avatar: '',
    createdAt: new Date().toISOString(),
  };

  db.addUser(newUser);
  const token = generateToken(newUser);
  db.logAudit('User Registered', newUser.id, newUser.name, `Registered new user account: ${newUser.email}`);

  const { passwordHash: _, ...userSafe } = newUser;
  res.status(201).json({ token, user: userSafe });
});

apiRouter.post('/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = db.findUserByEmail(email);
  if (!user || user.passwordHash !== db.hashPassword(password)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = generateToken(user);
  db.logAudit('User Login', user.id, user.name, `User logged in from ${user.email}`);

  const { passwordHash: _, ...userSafe } = user;
  res.json({ token, user: userSafe });
});

apiRouter.post('/auth/logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    activeTokens.delete(token);
  }
  res.json({ message: 'Successfully logged out' });
});

apiRouter.get('/auth/me', (req: Request, res: Response) => {
  const user = (req as any).user;
  if (!user) {
    return res.json({ user: null });
  }
  const { passwordHash: _, ...userSafe } = user;
  res.json({ user: userSafe });
});

apiRouter.patch('/auth/profile', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  const { name, phone, organization, bio, avatar } = req.body;

  const updated = db.updateUser(user.id, {
    ...(name && { name: name.trim() }),
    ...(phone !== undefined && { phone: phone.trim() }),
    ...(organization !== undefined && { organization: organization.trim() }),
    ...(bio !== undefined && { bio: bio.trim() }),
    ...(avatar !== undefined && { avatar: avatar.trim() }),
  });

  if (!updated) {
    return res.status(404).json({ error: 'User not found' });
  }

  const { passwordHash: _, ...userSafe } = updated;
  res.json({ user: userSafe });
});

// ======================== ITEMS (LOST & FOUND) ========================

// Sanitizer helper: Never expose private verification clues to the general public
function sanitizeItemForClient(item: Item, currentUserId?: string, userRole?: string): Item {
  const isOwner = currentUserId && item.userId === currentUserId;
  const isElevated = userRole === 'admin' || userRole === 'moderator';

  if (isOwner || isElevated) {
    return item;
  }

  // Deep clone and delete private fields
  const safe = { ...item };
  if (safe.privateClues) {
    // Only leave verificationQuestion if claimant needs to answer it, strip actual answer clues
    safe.privateClues = {
      verificationQuestion: safe.privateClues.verificationQuestion,
      handoverAvailability: safe.privateClues.handoverAvailability,
    };
  }
  return safe;
}

// Unified Items listing with high-performance filters
apiRouter.get('/items', (req: Request, res: Response) => {
  const {
    type, // 'lost' | 'found'
    search,
    category,
    city,
    brand,
    color,
    status,
    hasImage,
    userId,
    sortBy = 'newest',
    page = '1',
    limit = '12',
  } = req.query as Record<string, string>;

  let items = db.getItems();
  const currentUser = (req as any).user;

  if (type) {
    items = items.filter((i) => i.type === type);
  }
  if (category && category !== 'All') {
    items = items.filter((i) => i.category.toLowerCase() === category.toLowerCase());
  }
  if (city && city !== 'All') {
    items = items.filter((i) => i.city.toLowerCase() === city.toLowerCase());
  }
  if (brand) {
    items = items.filter((i) => i.brand.toLowerCase().includes(brand.toLowerCase()));
  }
  if (color) {
    items = items.filter((i) => i.color.toLowerCase().includes(color.toLowerCase()));
  }
  if (status && status !== 'All') {
    items = items.filter((i) => i.status === status);
  }
  if (hasImage === 'true') {
    items = items.filter((i) => i.images && i.images.length > 0 && i.images[0].url);
  }
  if (userId) {
    items = items.filter((i) => i.userId === userId);
  }
  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    items = items.filter((i) => {
      return (
        i.title.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        i.location.toLowerCase().includes(q) ||
        i.brand.toLowerCase().includes(q) ||
        i.color.toLowerCase().includes(q) ||
        i.subcategory.toLowerCase().includes(q)
      );
    });
  }

  // Sorting
  if (sortBy === 'oldest') {
    items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  } else {
    // Default newest
    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Pagination
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const pageSize = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));
  const total = items.length;
  const start = (pageNum - 1) * pageSize;
  const paginated = items.slice(start, start + pageSize);

  const sanitized = paginated.map((item) => sanitizeItemForClient(item, currentUser?.id, currentUser?.role));

  res.json({
    items: sanitized,
    total,
    page: pageNum,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
});

// Lost items dedicated route
apiRouter.get('/lost-items', (req: Request, res: Response) => {
  req.query.type = 'lost';
  (apiRouter as any).handle(req, res);
});

// Found items dedicated route
apiRouter.get('/found-items', (req: Request, res: Response) => {
  req.query.type = 'found';
  (apiRouter as any).handle(req, res);
});

// Single Item Detail
apiRouter.get('/items/:id', (req: Request, res: Response) => {
  const item = db.findItemById(req.params.id);
  if (!item) {
    return res.status(404).json({ error: 'Reported item not found' });
  }
  const currentUser = (req as any).user;
  res.json({ item: sanitizeItemForClient(item, currentUser?.id, currentUser?.role) });
});

// Create Item (Lost or Found)
apiRouter.post('/items', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  const {
    type,
    title,
    category,
    subcategory,
    description,
    date,
    time,
    location,
    city,
    color,
    brand,
    distinguishingFeatures = [],
    contactMethod,
    images = [],
    estimatedValue,
    reward,
    sensitiveData = false,
    privateClues = {},
  } = req.body;

  if (!type || !title || !category || !description || !date || !location || !city) {
    return res.status(400).json({ error: 'Missing mandatory fields: type, title, category, description, date, location, and city are required' });
  }

  const id = `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const now = new Date().toISOString();

  const newItem: Item = {
    id,
    type,
    title: title.trim(),
    category: category.trim(),
    subcategory: subcategory?.trim() || 'General',
    description: description.trim(),
    date,
    time: time || '12:00',
    location: location.trim(),
    city: city.trim(),
    color: color?.trim() || 'Unspecified',
    brand: brand?.trim() || 'Unmarked',
    distinguishingFeatures: Array.isArray(distinguishingFeatures) ? distinguishingFeatures : [],
    contactMethod: contactMethod?.trim() || 'In-app secure claim',
    images: Array.isArray(images) && images.length > 0 ? images : [{ url: '', isIllustrative: false }],
    estimatedValue: estimatedValue?.trim(),
    reward: reward?.trim(),
    sensitiveData: Boolean(sensitiveData),
    status: 'open',
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    isDemo: false,
    privateClues: {
      serialNumber: privateClues.serialNumber?.trim(),
      secretMarks: privateClues.secretMarks?.trim(),
      contentsOrWallpaper: privateClues.contentsOrWallpaper?.trim(),
      exactStorageLocation: privateClues.exactStorageLocation?.trim(),
      handoverAvailability: privateClues.handoverAvailability?.trim(),
      verificationQuestion: privateClues.verificationQuestion?.trim() || `Please verify identifying details for this ${title}.`,
    },
    createdAt: now,
    updatedAt: now,
  };

  db.addItem(newItem);
  db.logAudit(`Report Created (${type})`, user.id, user.name, `Created ${type} report #${id}: ${newItem.title}`);

  // Automated candidate match evaluation against reciprocal reports
  const reciprocalType = type === 'lost' ? 'found' : 'lost';
  const reciprocalItems = db.getItems().filter((i) => i.type === reciprocalType && i.status !== 'archived' && i.status !== 'closed');
  
  let matchFound = false;
  for (const target of reciprocalItems) {
    const lost = type === 'lost' ? newItem : target;
    const found = type === 'found' ? newItem : target;
    const matchResult = calculateMatchScore(lost, found);

    if (matchResult.score >= 60) {
      matchFound = true;
      db.addMatch({
        id: `match-${lost.id}-${found.id}`,
        lostItemId: lost.id,
        foundItemId: found.id,
        lostItemTitle: lost.title,
        foundItemTitle: found.title,
        score: matchResult.score,
        breakdown: matchResult.breakdown,
        matchingAttributes: matchResult.matchingAttributes,
        conflictingAttributes: matchResult.conflictingAttributes,
        whySuggested: matchResult.whySuggested,
        status: 'potential',
        createdAt: now,
      });

      // Notify owner of potential discovery
      db.addNotification({
        id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        userId: lost.userId,
        title: 'New Potential Match Discovered',
        message: `A candidate match (${matchResult.score}% compatibility) was found for your ${lost.title}.`,
        type: 'match',
        link: `/matches?lostId=${lost.id}`,
        read: false,
        createdAt: now,
      });
    }
  }

  res.status(201).json({
    item: sanitizeItemForClient(newItem, user.id, user.role),
    matchFound,
    message: 'Report submitted successfully and indexed for AI candidate matching.',
  });
});

// Update Item
apiRouter.patch('/items/:id', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  const existing = db.findItemById(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Item not found' });
  }

  const isOwner = existing.userId === user.id;
  const isStaff = user.role === 'admin' || user.role === 'moderator';
  if (!isOwner && !isStaff) {
    return res.status(403).json({ error: 'Not authorized to modify this report' });
  }

  const allowedFields = [
    'title',
    'category',
    'subcategory',
    'description',
    'location',
    'city',
    'color',
    'brand',
    'distinguishingFeatures',
    'status',
    'images',
    'reward',
    'contactMethod',
  ];
  const updates: Partial<Item> = {};
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      (updates as any)[field] = req.body[field];
    }
  }

  const updated = db.updateItem(existing.id, updates);
  db.logAudit('Report Updated', user.id, user.name, `Updated report #${existing.id}`);

  res.json({ item: sanitizeItemForClient(updated!, user.id, user.role) });
});

// Delete Item
apiRouter.delete('/items/:id', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  const existing = db.findItemById(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Item not found' });
  }

  const isOwner = existing.userId === user.id;
  const isStaff = user.role === 'admin' || user.role === 'moderator';
  if (!isOwner && !isStaff) {
    return res.status(403).json({ error: 'Not authorized to delete this report' });
  }

  db.deleteItem(existing.id);
  db.logAudit('Report Deleted', user.id, user.name, `Deleted report #${existing.id}`);
  res.json({ message: 'Report deleted successfully' });
});

// ======================== MATCHES & AI MATCHING ========================

apiRouter.get('/matches', (req: Request, res: Response) => {
  const { lostId, foundId, minScore = '50' } = req.query as Record<string, string>;
  
  // Re-run matching on all active items to make sure candidates are up-to-date
  const lostItems = db.getItems().filter((i) => i.type === 'lost' && i.status !== 'archived');
  const foundItems = db.getItems().filter((i) => i.type === 'found' && i.status !== 'archived');
  const computed = computeMatches(lostItems, foundItems);

  let filtered = computed;
  if (lostId) {
    filtered = filtered.filter((m) => m.lostItemId === lostId);
  }
  if (foundId) {
    filtered = filtered.filter((m) => m.foundItemId === foundId);
  }
  const min = parseInt(minScore, 10) || 50;
  filtered = filtered.filter((m) => m.score >= min);

  res.json({ matches: filtered, total: filtered.length });
});

apiRouter.get('/matches/:id', (req: Request, res: Response) => {
  const parts = req.params.id.replace('match-', '').split('-');
  if (parts.length < 2) {
    return res.status(400).json({ error: 'Invalid match ID format' });
  }
  const [lostId, foundId] = [parts[0] + '-' + parts[1] + '-' + parts[2], parts[3] + '-' + parts[4] + '-' + parts[5]];
  const lost = db.findItemById(lostId);
  const found = db.findItemById(foundId);

  if (!lost || !found) {
    return res.status(404).json({ error: 'Referenced match items could not be found' });
  }

  const matchData = calculateMatchScore(lost, found);
  const currentUser = (req as any).user;

  res.json({
    match: {
      id: req.params.id,
      lostItemId: lost.id,
      foundItemId: found.id,
      score: matchData.score,
      breakdown: matchData.breakdown,
      matchingAttributes: matchData.matchingAttributes,
      conflictingAttributes: matchData.conflictingAttributes,
      whySuggested: matchData.whySuggested,
    },
    lostItem: sanitizeItemForClient(lost, currentUser?.id, currentUser?.role),
    foundItem: sanitizeItemForClient(found, currentUser?.id, currentUser?.role),
  });
});

// Explain match with Gemini
apiRouter.post('/ai/explain-match', async (req: Request, res: Response) => {
  const { lostId, foundId } = req.body;
  const lost = db.findItemById(lostId);
  const found = db.findItemById(foundId);
  if (!lost || !found) {
    return res.status(404).json({ error: 'Items not found' });
  }

  const lostSummary = `${lost.title} in ${lost.color}, brand: ${lost.brand}, location: ${lost.location}, date: ${lost.date}. Description: ${lost.description}`;
  const foundSummary = `${found.title} in ${found.color}, brand: ${found.brand}, location: ${found.location}, date: ${found.date}. Description: ${found.description}`;

  const explanation = await explainMatch(lostSummary, foundSummary);
  res.json({ explanation });
});

// AI Description attribute extraction
apiRouter.post('/ai/analyze-description', async (req: Request, res: Response) => {
  const { text } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Text prompt is required' });
  }

  try {
    const analysis = await analyzeItemDescription(text);
    res.json({ analysis });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to analyze description' });
  }
});

// ======================== CLAIMS & OWNERSHIP VERIFICATION ========================

apiRouter.post('/claims', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  const { foundItemId, lostItemId, answers = [], privateProofDescription, proofDocumentUrl } = req.body;

  if (!foundItemId || !privateProofDescription) {
    return res.status(400).json({ error: 'Found item ID and private proof description are required to submit a claim' });
  }

  const foundItem = db.findItemById(foundItemId);
  if (!foundItem || foundItem.type !== 'found') {
    return res.status(404).json({ error: 'Target found item not found' });
  }

  if (foundItem.userId === user.id) {
    return res.status(400).json({ error: 'You cannot claim an item you reported finding' });
  }

  // Prevent duplicate pending claims from same user
  const existingClaim = db.getClaims().find((c) => c.foundItemId === foundItemId && c.claimantUserId === user.id && c.status === 'pending');
  if (existingClaim) {
    return res.status(409).json({ error: 'You already have an active claim under review for this item' });
  }

  const now = new Date().toISOString();
  const claimId = `claim-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  const newClaim: Claim = {
    id: claimId,
    foundItemId,
    foundItemTitle: foundItem.title,
    lostItemId,
    claimantUserId: user.id,
    claimantName: user.name,
    claimantEmail: user.email,
    reporterUserId: foundItem.userId,
    status: 'pending',
    answers: Array.isArray(answers) ? answers : [],
    privateProofDescription: privateProofDescription.trim(),
    proofDocumentUrl,
    handoverDetails: {
      safeLocation: foundItem.location || 'Campus Main Information Center',
      verificationCode: `TB-${Math.floor(1000 + Math.random() * 9000)}`,
      reporterConfirmed: false,
      claimantConfirmed: false,
    },
    timeline: [
      {
        action: 'Claim Submitted',
        timestamp: now,
        by: user.name,
        note: 'Submitted ownership verification proof.',
      },
    ],
    createdAt: now,
    updatedAt: now,
  };

  db.addClaim(newClaim);
  db.updateItem(foundItemId, { status: 'claimed' });

  // Notify reporter / moderator
  db.addNotification({
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    userId: foundItem.userId,
    title: 'New Ownership Claim Submitted',
    message: `${user.name} submitted a claim with verification proof for "${foundItem.title}".`,
    type: 'claim_update',
    link: `/claims/${claimId}`,
    read: false,
    createdAt: now,
  });

  db.logAudit('Claim Submitted', user.id, user.name, `Submitted claim #${claimId} for item #${foundItemId}`);

  res.status(201).json({
    claim: newClaim,
    message: 'Claim submitted securely. Ownership verification review is now pending.',
  });
});

// My claims (claims I submitted)
apiRouter.get('/claims/my', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  const claims = db.getClaims().filter((c) => c.claimantUserId === user.id);
  res.json({ claims });
});

// Incoming claims (claims on items I reported found, or all if admin/moderator)
apiRouter.get('/claims/incoming', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  const isStaff = user.role === 'admin' || user.role === 'moderator';

  const claims = isStaff
    ? db.getClaims()
    : db.getClaims().filter((c) => c.reporterUserId === user.id);

  res.json({ claims });
});

// Get single claim
apiRouter.get('/claims/:id', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  const claim = db.findClaimById(req.params.id);
  if (!claim) {
    return res.status(404).json({ error: 'Claim not found' });
  }

  const isClaimant = claim.claimantUserId === user.id;
  const isReporter = claim.reporterUserId === user.id;
  const isStaff = user.role === 'admin' || user.role === 'moderator';

  if (!isClaimant && !isReporter && !isStaff) {
    return res.status(403).json({ error: 'Not authorized to view this claim' });
  }

  const foundItem = db.findItemById(claim.foundItemId);

  res.json({
    claim,
    foundItem: foundItem ? sanitizeItemForClient(foundItem, user.id, user.role) : null,
  });
});

// Review claim (approve, reject, request info)
apiRouter.patch('/claims/:id/review', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  const { status, reviewNotes, safeLocation, scheduledTime } = req.body;

  const claim = db.findClaimById(req.params.id);
  if (!claim) {
    return res.status(404).json({ error: 'Claim not found' });
  }

  const isReporter = claim.reporterUserId === user.id;
  const isStaff = user.role === 'admin' || user.role === 'moderator';
  if (!isReporter && !isStaff) {
    return res.status(403).json({ error: 'Only the reporter or authorized moderator can review this claim' });
  }

  const validStatuses = ['under_review', 'approved', 'rejected', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid claim status transition' });
  }

  const now = new Date().toISOString();
  const timelineEntry = {
    action: `Claim marked as ${status.replace('_', ' ').toUpperCase()}`,
    timestamp: now,
    by: `${user.name} (${user.role})`,
    note: reviewNotes || undefined,
  };

  const updates: Partial<Claim> = {
    status,
    reviewNotes: reviewNotes || claim.reviewNotes,
    reviewerId: user.id,
    timeline: [...claim.timeline, timelineEntry],
  };

  if (safeLocation || scheduledTime) {
    updates.handoverDetails = {
      ...claim.handoverDetails,
      safeLocation: safeLocation || claim.handoverDetails?.safeLocation || 'Main Campus Security Desk',
      scheduledTime: scheduledTime || claim.handoverDetails?.scheduledTime,
      verificationCode: claim.handoverDetails?.verificationCode || `TB-${Math.floor(1000 + Math.random() * 9000)}`,
      reporterConfirmed: claim.handoverDetails?.reporterConfirmed || false,
      claimantConfirmed: claim.handoverDetails?.claimantConfirmed || false,
    };
  }

  const updatedClaim = db.updateClaim(claim.id, updates);

  // Update item status accordingly
  if (status === 'approved') {
    db.updateItem(claim.foundItemId, { status: 'claimed' });
  } else if (status === 'completed') {
    db.updateItem(claim.foundItemId, { status: 'returned' });
    if (claim.lostItemId) {
      db.updateItem(claim.lostItemId, { status: 'recovered' });
    }
  } else if (status === 'rejected') {
    db.updateItem(claim.foundItemId, { status: 'open' });
  }

  // Notify claimant
  db.addNotification({
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    userId: claim.claimantUserId,
    title: `Claim Update: ${status.replace('_', ' ').toUpperCase()}`,
    message: `Your claim for "${claim.foundItemTitle}" was updated to ${status}. ${reviewNotes ? `Note: ${reviewNotes}` : ''}`,
    type: 'claim_update',
    link: `/claims/${claim.id}`,
    read: false,
    createdAt: now,
  });

  db.logAudit(`Claim ${status}`, user.id, user.name, `Claim #${claim.id} updated to ${status}`);

  res.json({ claim: updatedClaim });
});

// Handover safe confirmation
apiRouter.post('/claims/:id/confirm-handover', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  const { verificationCode } = req.body;

  const claim = db.findClaimById(req.params.id);
  if (!claim) {
    return res.status(404).json({ error: 'Claim not found' });
  }

  const isClaimant = claim.claimantUserId === user.id;
  const isReporter = claim.reporterUserId === user.id;
  const isStaff = user.role === 'admin' || user.role === 'moderator';

  if (!isClaimant && !isReporter && !isStaff) {
    return res.status(403).json({ error: 'Not authorized' });
  }

  const handover = claim.handoverDetails || {
    safeLocation: 'Campus Security Station',
    verificationCode: 'TB-0000',
    reporterConfirmed: false,
    claimantConfirmed: false,
  };

  if (isClaimant) {
    handover.claimantConfirmed = true;
  }
  if (isReporter || isStaff) {
    if (verificationCode && verificationCode !== handover.verificationCode) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }
    handover.reporterConfirmed = true;
  }

  const now = new Date().toISOString();
  const bothConfirmed = handover.reporterConfirmed && handover.claimantConfirmed;

  const updatedClaim = db.updateClaim(claim.id, {
    handoverDetails: handover,
    status: bothConfirmed ? 'completed' : claim.status,
    timeline: [
      ...claim.timeline,
      {
        action: `Handover confirmed by ${isClaimant ? 'Claimant' : 'Reporter/Staff'}`,
        timestamp: now,
        by: user.name,
      },
      ...(bothConfirmed
        ? [
            {
              action: 'Item Safely Returned',
              timestamp: now,
              by: 'TraceBack Protocol',
              note: 'Both parties confirmed successful physical handover.',
            },
          ]
        : []),
    ],
  });

  if (bothConfirmed) {
    db.updateItem(claim.foundItemId, { status: 'returned' });
    if (claim.lostItemId) {
      db.updateItem(claim.lostItemId, { status: 'recovered' });
    }
  }

  res.json({
    claim: updatedClaim,
    bothConfirmed,
    message: bothConfirmed ? 'Item return fully completed! Celebratory confirmation recorded.' : 'Your confirmation has been saved.',
  });
});

// ======================== DASHBOARD & ANALYTICS ========================

apiRouter.get('/dashboard/summary', (_req: Request, res: Response) => {
  const items = db.getItems();
  const claims = db.getClaims();
  const matches = computeMatches(
    items.filter((i) => i.type === 'lost'),
    items.filter((i) => i.type === 'found')
  );

  const lostItems = items.filter((i) => i.type === 'lost');
  const foundItems = items.filter((i) => i.type === 'found');

  const totalLost = lostItems.length;
  const totalFound = foundItems.length;
  const activeReports = items.filter((i) => i.status === 'open' || i.status === 'matched').length;
  const potentialMatches = matches.length;
  const pendingClaims = claims.filter((c) => c.status === 'pending' || c.status === 'under_review').length;
  const itemsReturned = items.filter((i) => i.status === 'recovered' || i.status === 'returned').length;

  // Recovery rate = items returned / total reports
  const recoveryRate = totalLost + totalFound > 0 ? Math.round((itemsReturned / (totalLost + totalFound)) * 100) : 0;

  // Breakdown by Category
  const categoryMap: Record<string, { lost: number; found: number }> = {};
  for (const item of items) {
    if (!categoryMap[item.category]) {
      categoryMap[item.category] = { lost: 0, found: 0 };
    }
    if (item.type === 'lost') categoryMap[item.category].lost++;
    else categoryMap[item.category].found++;
  }

  const categoryDistribution = Object.keys(categoryMap).map((cat) => ({
    name: cat,
    lost: categoryMap[cat].lost,
    found: categoryMap[cat].found,
    total: categoryMap[cat].lost + categoryMap[cat].found,
  }));

  // Top venues
  const locationMap: Record<string, number> = {};
  for (const item of items) {
    locationMap[item.location] = (locationMap[item.location] || 0) + 1;
  }
  const topLocations = Object.entries(locationMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
    .map(([location, count]) => ({ location, count }));

  // Trend data over 6 months
  const monthlyTrends = [
    { month: 'May', lost: 14, found: 12, recovered: 9 },
    { month: 'Jun', lost: 18, found: 16, recovered: 13 },
    { month: 'Jul', lost: 12, found: 10, recovered: 8 },
    { month: 'Aug', lost: 22, found: 19, recovered: 16 },
    { month: 'Sep', lost: 34, found: 30, recovered: 25 },
    { month: 'Oct', lost: totalLost, found: totalFound, recovered: itemsReturned },
  ];

  res.json({
    summary: {
      totalLost,
      totalFound,
      activeReports,
      potentialMatches,
      pendingClaims,
      itemsReturned,
      recoveryRate,
    },
    categoryDistribution,
    topLocations,
    monthlyTrends,
  });
});

// ======================== NOTIFICATIONS ========================

apiRouter.get('/notifications', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  const notifs = db.getNotifications(user.id);
  res.json({ notifications: notifs });
});

apiRouter.patch('/notifications/:id/read', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  const updated = db.markNotificationRead(req.params.id, user.id);
  res.json({ notification: updated });
});

apiRouter.post('/notifications/read-all', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  const count = db.markAllNotificationsRead(user.id);
  res.json({ message: 'All notifications marked as read', count });
});

// ======================== COMMUNITY & STORIES ========================

apiRouter.get('/community/stories', (_req: Request, res: Response) => {
  res.json({ stories: db.getCommunityStories() });
});

// ======================== ADMIN & BENCHMARK SEED ========================

apiRouter.get('/admin/audit-logs', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  if (user.role !== 'admin' && user.role !== 'moderator') {
    return res.status(403).json({ error: 'Access restricted to administrators' });
  }
  res.json({ logs: db.getAuditLogs() });
});

apiRouter.get('/admin/seed-status', (_req: Request, res: Response) => {
  const items = db.getItems();
  const demoItems = items.filter((i) => i.isDemo);
  const lostDemo = demoItems.filter((i) => i.type === 'lost').length;
  const foundDemo = demoItems.filter((i) => i.type === 'found').length;

  res.json({
    isSeeded: demoItems.length === 100,
    totalItems: items.length,
    demoItemsTotal: demoItems.length,
    lostDemoCount: lostDemo,
    foundDemoCount: foundDemo,
    realUserItems: items.length - demoItems.length,
  });
});

apiRouter.post('/admin/reset-demo', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  if (user.role !== 'admin') {
    return res.status(403).json({ error: 'Administrator role required to reset demo benchmark data' });
  }

  const result = db.resetDemoData();
  db.logAudit('Benchmark Dataset Reset', user.id, user.name, 'Admin reset demo items to 100 verified items.');
  res.json(result);
});
