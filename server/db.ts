import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import dotenv from 'dotenv';

dotenv.config();

export type UserRole = 'guest' | 'user' | 'moderator' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  organization?: string;
  bio?: string;
  createdAt: string;
}

export type ItemType = 'lost' | 'found';
export type ItemStatus = 'open' | 'matched' | 'claimed' | 'recovered' | 'returned' | 'closed' | 'archived';

export interface PrivateClues {
  serialNumber?: string;
  secretMarks?: string;
  contentsOrWallpaper?: string;
  exactStorageLocation?: string;
  handoverAvailability?: string;
  verificationQuestion?: string;
}

export interface ItemImage {
  url: string;
  isIllustrative: boolean;
  label?: string;
}

export interface Item {
  id: string;
  type: ItemType;
  title: string;
  category: string;
  subcategory: string;
  description: string;
  date: string; // YYYY-MM-DD
  time?: string;
  location: string;
  city: string;
  coordinates?: { lat: number; lng: number };
  color: string;
  brand: string;
  distinguishingFeatures: string[];
  contactMethod: string;
  images: ItemImage[];
  estimatedValue?: string;
  reward?: string;
  sensitiveData: boolean;
  status: ItemStatus;
  userId: string;
  userName: string;
  userEmail: string;
  isDemo: boolean;
  privateClues?: PrivateClues;
  createdAt: string;
  updatedAt: string;
}

export interface MatchBreakdown {
  categoryScore: number;
  brandScore: number;
  colorScore: number;
  locationScore: number;
  dateScore: number;
  textScore: number;
}

export interface MatchCandidate {
  id: string;
  lostItemId: string;
  foundItemId: string;
  lostItemTitle: string;
  foundItemTitle: string;
  score: number;
  breakdown: MatchBreakdown;
  matchingAttributes: string[];
  conflictingAttributes: string[];
  whySuggested: string;
  status: 'potential' | 'dismissed' | 'claimed' | 'confirmed';
  createdAt: string;
}

export type ClaimStatus = 'pending' | 'under_review' | 'approved' | 'rejected' | 'completed' | 'cancelled';

export interface ClaimVerificationAnswer {
  question: string;
  answer: string;
}

export interface Claim {
  id: string;
  foundItemId: string;
  foundItemTitle: string;
  lostItemId?: string;
  claimantUserId: string;
  claimantName: string;
  claimantEmail: string;
  reporterUserId: string;
  status: ClaimStatus;
  answers: ClaimVerificationAnswer[];
  privateProofDescription: string;
  proofDocumentUrl?: string;
  reviewNotes?: string;
  reviewerId?: string;
  handoverDetails?: {
    safeLocation: string;
    scheduledTime?: string;
    verificationCode?: string;
    reporterConfirmed: boolean;
    claimantConfirmed: boolean;
  };
  timeline: { action: string; timestamp: string; by: string; note?: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'match' | 'claim_update' | 'message' | 'system';
  link?: string;
  read: boolean;
  createdAt: string;
}

export interface CommunityStory {
  id: string;
  title: string;
  itemName: string;
  category: string;
  story: string;
  venue: string;
  daysToRecover: number;
  imageUrl?: string;
  authorName: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  action: string;
  userId: string;
  userName: string;
  details: string;
  timestamp: string;
}

interface DatabaseSchema {
  users: User[];
  items: Item[];
  matches: MatchCandidate[];
  claims: Claim[];
  notifications: NotificationItem[];
  communityStories: CommunityStory[];
  auditLogs: AuditLog[];
  meta: {
    seededAt: string;
    demoCount: number;
    version: string;
  };
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'traceback-db.json');

// Mongoose Models
export const UserModel = mongoose.models.User || mongoose.model('User', new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: String,
  email: { type: String, required: true, unique: true },
  passwordHash: String,
  role: String,
  avatar: String,
  phone: String,
  organization: String,
  bio: String,
  createdAt: String,
}, { timestamps: true }));

export const ItemModel = mongoose.models.Item || mongoose.model('Item', new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  type: String,
  title: String,
  category: String,
  subcategory: String,
  description: String,
  date: String,
  time: String,
  location: String,
  city: String,
  color: String,
  brand: String,
  distinguishingFeatures: [String],
  contactMethod: String,
  images: [{ url: String, isIllustrative: Boolean, label: String }],
  estimatedValue: String,
  reward: String,
  sensitiveData: Boolean,
  status: String,
  userId: String,
  userName: String,
  userEmail: String,
  isDemo: Boolean,
  privateClues: {
    serialNumber: String,
    secretMarks: String,
    contentsOrWallpaper: String,
    exactStorageLocation: String,
    handoverAvailability: String,
    verificationQuestion: String,
  },
  createdAt: String,
  updatedAt: String,
}, { timestamps: true }));

export const ClaimModel = mongoose.models.Claim || mongoose.model('Claim', new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  foundItemId: String,
  foundItemTitle: String,
  lostItemId: String,
  claimantUserId: String,
  claimantName: String,
  claimantEmail: String,
  reporterUserId: String,
  status: String,
  answers: [{ question: String, answer: String }],
  privateProofDescription: String,
  proofDocumentUrl: String,
  reviewNotes: String,
  reviewerId: String,
  handoverDetails: {
    safeLocation: String,
    scheduledTime: String,
    verificationCode: String,
    reporterConfirmed: Boolean,
    claimantConfirmed: Boolean,
  },
  timeline: [{ action: String, timestamp: String, by: String, note: String }],
  createdAt: String,
  updatedAt: String,
}, { timestamps: true }));

export const MatchModel = mongoose.models.Match || mongoose.model('Match', new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  lostItemId: String,
  foundItemId: String,
  lostItemTitle: String,
  foundItemTitle: String,
  score: Number,
  breakdown: {
    categoryScore: Number,
    brandScore: Number,
    colorScore: Number,
    locationScore: Number,
    dateScore: Number,
    textScore: Number,
  },
  matchingAttributes: [String],
  conflictingAttributes: [String],
  whySuggested: String,
  status: String,
  createdAt: String,
}, { timestamps: true }));

export const AuditLogModel = mongoose.models.AuditLog || mongoose.model('AuditLog', new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  action: String,
  userId: String,
  userName: String,
  details: String,
  timestamp: String,
}));

// Memory store backed by atomic disk JSON and MongoDB
class MemoryDatabase {
  private data: DatabaseSchema = {
    users: [],
    items: [],
    matches: [],
    claims: [],
    notifications: [],
    communityStories: [],
    auditLogs: [],
    meta: {
      seededAt: '',
      demoCount: 0,
      version: '1.0.0',
    },
  };

  private saveTimeout: NodeJS.Timeout | null = null;
  private mongoConnected: boolean = false;
  private isRemoteAtlas: boolean = false;
  private mongoErrorMessage: string = '';
  private mongoUri: string = '';
  private mongodInstance: any = null;

  constructor() {
    this.init();
    this.initMongo();
  }

  private async initMongo() {
    const rawUri = process.env.MONGODB_URI;

    // 1. Try remote MongoDB Atlas if a cluster URI is configured
    if (rawUri && !rawUri.includes('cluster0.traceback.mongodb.net') && !rawUri.includes('127.0.0.1') && !rawUri.includes('localhost')) {
      this.mongoUri = rawUri;
      try {
        console.log(`[TraceBack DB] Connecting to remote MongoDB Atlas: ${this.getRedactedUri(rawUri)}...`);
        await mongoose.connect(rawUri, {
          serverSelectionTimeoutMS: 10000,
          dbName: 'traceback',
        });
        this.mongoConnected = true;
        this.isRemoteAtlas = true;
        console.log('[TraceBack DB] Successfully connected to remote MongoDB Atlas cluster!');
        await this.syncWithMongo();
        return;
      } catch (err: any) {
        this.mongoErrorMessage = err?.message || 'Remote cluster connection timeout';
        console.warn(`[TraceBack DB] Remote MongoDB Atlas connection notice (${this.mongoErrorMessage}). Starting dedicated fallback engine...`);
      }
    }

    // 2. Automatically launch high-performance in-process MongoDB engine if remote cannot be reached
    try {
      console.log('[TraceBack DB] Starting in-process MongoDB server engine...');
      this.mongodInstance = await MongoMemoryServer.create({
        instance: { dbName: 'traceback' },
      });
      const localUri = this.mongodInstance.getUri();
      this.mongoUri = localUri;
      await mongoose.connect(localUri);
      this.mongoConnected = true;
      console.log(`[TraceBack DB] MongoDB connected successfully on ${localUri}`);
      await this.syncWithMongo();
    } catch (err: any) {
      console.warn(`[TraceBack DB] MongoDB engine notice: ${err.message}`);
    }
  }

  private async syncWithMongo() {
    if (!this.mongoConnected) return;
    try {
      const existingCount = await ItemModel.countDocuments();
      if (existingCount === 0 && this.data.items.length > 0) {
        await ItemModel.insertMany(this.data.items);
        console.log(`[TraceBack DB] Synced ${this.data.items.length} items into MongoDB collection`);
      }
      const userCount = await UserModel.countDocuments();
      if (userCount === 0 && this.data.users.length > 0) {
        await UserModel.insertMany(this.data.users);
      }
    } catch (e: any) {
      console.warn('[TraceBack DB] Mongo sync notice:', e?.message || e);
    }
  }

  public getRedactedUri(rawUri: string = process.env.MONGODB_URI || this.mongoUri): string {
    if (!rawUri) return 'Not configured';
    return rawUri.replace(/(:\/\/)(.*?:)(.*?)(@)/, '$1$2****$4');
  }

  public getDatabaseStatus() {
    return {
      connected: this.mongoConnected,
      isRemoteAtlas: this.isRemoteAtlas,
      provider: this.isRemoteAtlas ? 'MongoDB Atlas (User Cluster)' : (this.mongoConnected ? 'MongoDB (Mongoose)' : 'TraceBack Persistent Storage Engine'),
      uriRedacted: this.getRedactedUri(),
      activeUri: this.mongoUri || 'mongodb://127.0.0.1:27017/traceback',
      hasMongoUri: Boolean(process.env.MONGODB_URI),
      totalItems: this.data.items.length,
      status: this.isRemoteAtlas ? 'Connected to MongoDB Atlas' : (this.mongoConnected ? 'Connected to MongoDB' : 'Active (Local Persistent)'),
      notice: this.mongoErrorMessage || undefined,
    };
  }

  private init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.items && Array.isArray(parsed.items)) {
          this.data = parsed;
          console.log(`[TraceBack DB] Loaded existing database with ${this.data.items.length} items`);
          return;
        }
      }
    } catch (e) {
      console.warn('[TraceBack DB] Failed to read existing db file, will initialize fresh', e);
    }

    this.seedDefaultData();
    this.persistNow();
  }

  public persist() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(() => this.persistNow(), 100);
  }

  public persistNow() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const tmpFile = `${DB_FILE}.tmp`;
      fs.writeFileSync(tmpFile, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tmpFile, DB_FILE);
    } catch (err) {
      console.error('[TraceBack DB] Failed to write db file:', err);
    }
  }

  // Users
  public getUsers() {
    return this.data.users;
  }

  public findUserById(id: string) {
    return this.data.users.find((u) => u.id === id);
  }

  public findUserByEmail(email: string) {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  public addUser(user: User) {
    this.data.users.push(user);
    this.persist();
    return user;
  }

  public updateUser(id: string, updates: Partial<User>) {
    const idx = this.data.users.findIndex((u) => u.id === id);
    if (idx !== -1) {
      this.data.users[idx] = { ...this.data.users[idx], ...updates };
      this.persist();
      return this.data.users[idx];
    }
    return null;
  }

  // Items
  public getItems() {
    return this.data.items;
  }

  public findItemById(id: string) {
    return this.data.items.find((i) => i.id === id);
  }

  public addItem(item: Item) {
    this.data.items.unshift(item);
    this.persist();
    return item;
  }

  public updateItem(id: string, updates: Partial<Item>) {
    const idx = this.data.items.findIndex((i) => i.id === id);
    if (idx !== -1) {
      this.data.items[idx] = {
        ...this.data.items[idx],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      this.persist();
      return this.data.items[idx];
    }
    return null;
  }

  public deleteItem(id: string) {
    const idx = this.data.items.findIndex((i) => i.id === id);
    if (idx !== -1) {
      const removed = this.data.items.splice(idx, 1)[0];
      this.persist();
      return removed;
    }
    return null;
  }

  // Matches
  public getMatches() {
    return this.data.matches;
  }

  public findMatchById(id: string) {
    return this.data.matches.find((m) => m.id === id);
  }

  public setMatches(matches: MatchCandidate[]) {
    this.data.matches = matches;
    this.persist();
  }

  public addMatch(match: MatchCandidate) {
    const existing = this.data.matches.findIndex(
      (m) => m.lostItemId === match.lostItemId && m.foundItemId === match.foundItemId
    );
    if (existing !== -1) {
      this.data.matches[existing] = match;
    } else {
      this.data.matches.unshift(match);
    }
    this.persist();
  }

  public updateMatch(id: string, updates: Partial<MatchCandidate>) {
    const idx = this.data.matches.findIndex((m) => m.id === id);
    if (idx !== -1) {
      this.data.matches[idx] = { ...this.data.matches[idx], ...updates };
      this.persist();
      return this.data.matches[idx];
    }
    return null;
  }

  // Claims
  public getClaims() {
    return this.data.claims;
  }

  public findClaimById(id: string) {
    return this.data.claims.find((c) => c.id === id);
  }

  public addClaim(claim: Claim) {
    this.data.claims.unshift(claim);
    this.persist();
    return claim;
  }

  public updateClaim(id: string, updates: Partial<Claim>) {
    const idx = this.data.claims.findIndex((c) => c.id === id);
    if (idx !== -1) {
      this.data.claims[idx] = {
        ...this.data.claims[idx],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      this.persist();
      return this.data.claims[idx];
    }
    return null;
  }

  // Notifications
  public getNotifications(userId?: string) {
    if (!userId) return this.data.notifications;
    return this.data.notifications.filter((n) => n.userId === userId || n.userId === 'all');
  }

  public addNotification(notification: NotificationItem) {
    this.data.notifications.unshift(notification);
    this.persist();
    return notification;
  }

  public markNotificationRead(id: string, userId: string) {
    const n = this.data.notifications.find((item) => item.id === id && (item.userId === userId || item.userId === 'all'));
    if (n) {
      n.read = true;
      this.persist();
      return n;
    }
    return null;
  }

  public markAllNotificationsRead(userId: string) {
    let count = 0;
    this.data.notifications.forEach((n) => {
      if (n.userId === userId || n.userId === 'all') {
        n.read = true;
        count++;
      }
    });
    this.persist();
    return count;
  }

  // Community Stories
  public getCommunityStories() {
    return this.data.communityStories;
  }

  // Audit Logs
  public getAuditLogs() {
    return this.data.auditLogs;
  }

  public logAudit(action: string, userId: string, userName: string, details: string) {
    const entry: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      action,
      userId,
      userName,
      details,
      timestamp: new Date().toISOString(),
    };
    this.data.auditLogs.unshift(entry);
    if (this.data.auditLogs.length > 500) {
      this.data.auditLogs.pop();
    }
    this.persist();
    return entry;
  }

  // Safe reset for Demo Data without destroying real user records
  public resetDemoData() {
    // Keep user-created items
    const userItems = this.data.items.filter((i) => !i.isDemo);
    const userClaims = this.data.claims.filter((c) => !c.id.startsWith('claim-demo'));
    const userNotifications = this.data.notifications.filter((n) => !n.id.startsWith('notif-demo'));
    
    this.seedDefaultData();
    // Re-attach real user creations
    this.data.items = [...userItems, ...this.data.items];
    this.data.claims = [...userClaims, ...this.data.claims];
    this.data.notifications = [...userNotifications, ...this.data.notifications];
    this.persistNow();
    return {
      message: 'Demo dataset reset successfully to 100 benchmark items.',
      totalItems: this.data.items.length,
      demoItems: 100,
    };
  }

  public hashPassword(pwd: string): string {
    return crypto.createHash('sha256').update(pwd + 'traceback_salt_2026').digest('hex');
  }

  // 100 Realistic Demo Items Seeding Logic
  public seedDefaultData() {
    const now = new Date();
    const demoUsers: User[] = [
      {
        id: 'usr-admin-1',
        name: 'Marcus Vance',
        email: 'marcus.admin@traceback.org',
        passwordHash: this.hashPassword('admin123'),
        role: 'admin',
        avatar: '/src/assets/images/avatar_marcus_admin_1792785746915.jpg',
        phone: '+1 (555) 019-4820',
        organization: 'Campus Safety & Facility Operations',
        bio: 'Lead administrator for university lost and found management and verified returns.',
        createdAt: new Date(now.getTime() - 90 * 86400000).toISOString(),
      },
      {
        id: 'usr-mod-1',
        name: 'Sarah Chen',
        email: 'sarah.chen@traceback.org',
        passwordHash: this.hashPassword('mod123'),
        role: 'moderator',
        avatar: '/src/assets/images/avatar_sarah_chen_1792785746764.jpg',
        phone: '+1 (555) 012-7893',
        organization: 'Student Union Guild',
        bio: 'Senior student coordinator and trusted verification reviewer.',
        createdAt: new Date(now.getTime() - 60 * 86400000).toISOString(),
      },
      {
        id: 'usr-demo-student',
        name: 'David Miller',
        email: 'david.miller@campus.edu',
        passwordHash: this.hashPassword('user123'),
        role: 'user',
        avatar: '',
        phone: '+1 (555) 014-9921',
        organization: 'Faculty of Engineering',
        bio: 'Electrical Engineering student.',
        createdAt: new Date(now.getTime() - 30 * 86400000).toISOString(),
      },
      {
        id: 'usr-demo-emily',
        name: 'Emily Watson',
        email: 'emily.watson@campus.edu',
        passwordHash: this.hashPassword('user123'),
        role: 'user',
        avatar: '',
        phone: '+1 (555) 018-3412',
        organization: 'College of Arts & Sciences',
        bio: 'Design graduate student.',
        createdAt: new Date(now.getTime() - 25 * 86400000).toISOString(),
      },
    ];

    const seededItems = generate100DemoItems(demoUsers);

    const initialClaims: Claim[] = [
      {
        id: 'claim-demo-1',
        foundItemId: 'found-demo-01',
        foundItemTitle: 'Space Gray MacBook Pro 14" (M3)',
        claimantUserId: 'usr-demo-student',
        claimantName: 'David Miller',
        claimantEmail: 'david.miller@campus.edu',
        reporterUserId: 'usr-mod-1',
        status: 'under_review',
        answers: [
          {
            question: 'What distinctive sticker or mark is on the laptop lid?',
            answer: 'A holographic Rust programming language ferris crab sticker and an ACM chapter badge on bottom left corner.',
          },
          {
            question: 'What is the lockscreen wallpaper image?',
            answer: 'James Webb Deep Field Carina Nebula wallpaper.',
          },
        ],
        privateProofDescription: 'I have the original Apple Store invoice showing serial ending in 9J2M and purchase date October 2024.',
        proofDocumentUrl: '',
        reviewNotes: 'Sticker descriptions match item custody records accurately. Verifying serial number match.',
        reviewerId: 'usr-mod-1',
        handoverDetails: {
          safeLocation: 'Campus Security Station A, Main Library Lobby',
          scheduledTime: 'Tomorrow at 2:00 PM',
          verificationCode: 'TB-8942',
          reporterConfirmed: false,
          claimantConfirmed: true,
        },
        timeline: [
          {
            action: 'Claim Submitted',
            timestamp: new Date(now.getTime() - 18 * 3600000).toISOString(),
            by: 'David Miller',
            note: 'Claim submitted with proof details.',
          },
          {
            action: 'Moderator Review Started',
            timestamp: new Date(now.getTime() - 8 * 3600000).toISOString(),
            by: 'Sarah Chen (Moderator)',
            note: 'Answers match physical item inspection.',
          },
        ],
        createdAt: new Date(now.getTime() - 18 * 3600000).toISOString(),
        updatedAt: new Date(now.getTime() - 8 * 3600000).toISOString(),
      },
      {
        id: 'claim-demo-2',
        foundItemId: 'found-demo-03',
        foundItemTitle: 'Matte Black Sony WH-1000XM5 Headphones',
        claimantUserId: 'usr-demo-emily',
        claimantName: 'Emily Watson',
        claimantEmail: 'emily.watson@campus.edu',
        reporterUserId: 'usr-admin-1',
        status: 'completed',
        answers: [
          {
            question: 'What Bluetooth device name is registered on the headphones?',
            answer: "Emily's QuietXM5",
          },
        ],
        privateProofDescription: 'Serial number verified against Sony Headphones Connect app screenshot.',
        reviewNotes: 'Owner confirmed identity and device paired in presence of staff. Successfully returned.',
        reviewerId: 'usr-admin-1',
        handoverDetails: {
          safeLocation: 'Student Union Help Desk',
          scheduledTime: 'Yesterday 4:30 PM',
          verificationCode: 'TB-1102',
          reporterConfirmed: true,
          claimantConfirmed: true,
        },
        timeline: [
          {
            action: 'Claim Approved',
            timestamp: new Date(now.getTime() - 48 * 3600000).toISOString(),
            by: 'Marcus Vance',
            note: 'Handover scheduled at Union desk.',
          },
          {
            action: 'Item Safely Returned',
            timestamp: new Date(now.getTime() - 24 * 3600000).toISOString(),
            by: 'Marcus Vance',
            note: 'Both parties confirmed safe physical handover.',
          },
        ],
        createdAt: new Date(now.getTime() - 54 * 3600000).toISOString(),
        updatedAt: new Date(now.getTime() - 24 * 3600000).toISOString(),
      },
    ];

    const initialNotifications: NotificationItem[] = [
      {
        id: 'notif-demo-1',
        userId: 'usr-demo-student',
        title: 'High-Confidence AI Match Found',
        message: 'A found Space Gray MacBook Pro 14" matching your reported item was deposited at Campus Library Desk.',
        type: 'match',
        link: '/matches',
        read: false,
        createdAt: new Date(now.getTime() - 12 * 3600000).toISOString(),
      },
      {
        id: 'notif-demo-2',
        userId: 'usr-demo-student',
        title: 'Claim Update: Under Review',
        message: 'Moderator Sarah Chen has begun reviewing your verification answers for Claim TB-8942.',
        type: 'claim_update',
        link: '/my-claims',
        read: false,
        createdAt: new Date(now.getTime() - 8 * 3600000).toISOString(),
      },
      {
        id: 'notif-demo-3',
        userId: 'usr-demo-emily',
        title: 'Item Return Confirmed!',
        message: 'Your Sony WH-1000XM5 headphones return has been recorded. Thank you for using TraceBack.',
        type: 'claim_update',
        link: '/my-claims',
        read: true,
        createdAt: new Date(now.getTime() - 24 * 3600000).toISOString(),
      },
    ];

    const communityStories: CommunityStory[] = [
      {
        id: 'story-1',
        title: 'Master Thesis Saved: Laptop Reunited Within 3 Hours',
        itemName: 'ThinkPad X1 Carbon with Research Data',
        category: 'Electronics',
        story: 'Lost in the Engineering quad cafe during finals week. A student handed it in to security, and TraceBack descriptive matching linked it before the owner even panicked.',
        venue: 'North Engineering Cafe',
        daysToRecover: 1,
        imageUrl: '/src/assets/images/item_sample_laptop_1792785746551.jpg',
        authorName: 'Alex Rivera',
        createdAt: new Date(now.getTime() - 5 * 86400000).toISOString(),
      },
      {
        id: 'story-2',
        title: 'Family Heirloom Keychain Returned Safe',
        itemName: 'Brass Monogrammed Keychain with Car Keys',
        category: 'Keys & Badges',
        story: 'Slipped between gym bleachers during alumni basketball weekend. Private verification clue about the engraved coordinates confirmed ownership instantly.',
        venue: 'Campus Recreation Arena',
        daysToRecover: 2,
        imageUrl: '',
        authorName: 'Hannah Patel',
        createdAt: new Date(now.getTime() - 12 * 86400000).toISOString(),
      },
      {
        id: 'story-3',
        title: 'Camera Gear Recovered at Central Train Terminal',
        itemName: 'Charcoal Camera Backpack with Lenses',
        category: 'Bags & Luggage',
        story: 'Left on the commuter rail overhead rack. Found by station staff, logged with private serial verification, safely handed over at Station Master Office.',
        venue: 'Metro Central Station',
        daysToRecover: 3,
        imageUrl: '/src/assets/images/item_sample_backpack_1792785746923.jpg',
        authorName: 'Liam O’Connor',
        createdAt: new Date(now.getTime() - 19 * 86400000).toISOString(),
      },
    ];

    const auditLogs: AuditLog[] = [
      {
        id: 'audit-1',
        action: 'System Seed Initialized',
        userId: 'usr-admin-1',
        userName: 'Marcus Vance',
        details: 'TraceBack benchmark dataset initialized with 100 realistic community reports.',
        timestamp: now.toISOString(),
      },
      {
        id: 'audit-2',
        action: 'Claim Handover Completed',
        userId: 'usr-admin-1',
        userName: 'Marcus Vance',
        details: 'Handover verification code TB-1102 confirmed for Sony WH-1000XM5 headphones.',
        timestamp: new Date(now.getTime() - 24 * 3600000).toISOString(),
      },
    ];

    this.data = {
      users: demoUsers,
      items: seededItems,
      matches: [],
      claims: initialClaims,
      notifications: initialNotifications,
      communityStories,
      auditLogs,
      meta: {
        seededAt: now.toISOString(),
        demoCount: 100,
        version: '1.0.0',
      },
    };
  }
}

// Helper to generate exactly 100 diverse, realistic reports (50 lost, 50 found)
function generate100DemoItems(users: User[]): Item[] {
  const items: Item[] = [];
  const now = new Date();

  const cities = ['Boston', 'Cambridge', 'San Francisco', 'Chicago', 'Seattle', 'Austin', 'New York'];
  const campusVenues = [
    'Main Library 3rd Floor Quiet Study',
    'Student Union Dining Hall',
    'Science Center Atrium',
    'North Quad Engineering Lab 204',
    'Athletics Gym Locker Area',
    'Central Transit Hub Gate 3',
    'Law School Reading Room',
    'Campus Coffee Commons',
    'Arts Pavillion Lecture Hall B',
    'Medical Center Cafeteria',
    'South Dorms Laundry Room',
    'University Bookstore Counter',
  ];

  // Specific high-value paired items (15 direct matching pairs for AI matching demonstration!)
  const pairedItems: Array<{
    category: string;
    subcategory: string;
    lostTitle: string;
    foundTitle: string;
    lostDesc: string;
    foundDesc: string;
    color: string;
    brand: string;
    location: string;
    city: string;
    distinguishing: string[];
    privateClue: string;
    image?: string;
  }> = [
    {
      category: 'Electronics',
      subcategory: 'Laptops',
      lostTitle: 'Space Gray MacBook Pro 14" M3',
      foundTitle: 'Space Gray MacBook Pro 14-inch found on table',
      lostDesc: 'Left on a corner study desk on the 3rd floor quiet zone. Encased in a dark navy Tomtoc sleeve.',
      foundDesc: 'Found unattended laptop on table near 3rd floor west windows with a padded sleeve.',
      color: 'Space Gray',
      brand: 'Apple',
      location: 'Main Library 3rd Floor Quiet Study',
      city: 'Cambridge',
      distinguishing: ['Rust crab sticker on lid', 'Slight nick near charging port'],
      privateClue: 'Serial ends in 9J2M; wallpaper is Carina nebula',
      image: '/src/assets/images/item_sample_laptop_1792785746551.jpg',
    },
    {
      category: 'Bags & Luggage',
      subcategory: 'Backpacks',
      lostTitle: 'Charcoal Waxed Canvas Commuter Backpack',
      foundTitle: 'Found Charcoal Canvas Backpack near cafe tables',
      lostDesc: 'Forgot under the high-top table at the Union cafe while studying for midterms. Contains notebooks and chargers.',
      foundDesc: 'Dark gray waxed canvas rucksack discovered by custodial staff near dining hall exit.',
      color: 'Charcoal Gray',
      brand: 'Bellroy',
      location: 'Student Union Dining Hall',
      city: 'Boston',
      distinguishing: ['Brass zipper pulls', 'Orange interior lining', 'Small carabiner on strap'],
      privateClue: 'Contains blue spiral notebook with Calculus III notes',
      image: '/src/assets/images/item_sample_backpack_1792785746923.jpg',
    },
    {
      category: 'Electronics',
      subcategory: 'Headphones',
      lostTitle: 'Sony WH-1000XM5 Wireless Headphones in Case',
      foundTitle: 'Sony Over-Ear Noise Cancelling Headphones in zippered case',
      lostDesc: 'Black Sony headphones inside original gray fabric zip case. Left on bench outside physics lecture.',
      foundDesc: 'Black high-end wireless headphones in carrying case handed into lost desk.',
      color: 'Black',
      brand: 'Sony',
      location: 'Science Center Atrium',
      city: 'Cambridge',
      distinguishing: ['Custom braided auxiliary audio cable inside mesh pocket'],
      privateClue: 'Registered Bluetooth name: "Emily\'s QuietXM5"',
    },
    {
      category: 'Personal Accessories',
      subcategory: 'Watches',
      lostTitle: 'Apple Watch Series 9 45mm with Sport Loop',
      foundTitle: 'Smartwatch with Starlight Fabric Loop band',
      lostDesc: 'Slipped off during basketball training in gym court 2. Midnight aluminum casing.',
      foundDesc: 'Dark smartwatch found resting on gym bleachers after evening intramural game.',
      color: 'Midnight Black',
      brand: 'Apple',
      location: 'Athletics Gym Locker Area',
      city: 'Boston',
      distinguishing: ['Scratched top right glass edge', 'Starlight reflective loop'],
      privateClue: 'Monogrammed initial "D" visible in health app profile',
    },
    {
      category: 'Keys & Badges',
      subcategory: 'Car Keys',
      lostTitle: 'Subaru Key Fob with University Lanyard',
      foundTitle: 'Subaru Smart Car Key on Blue Lanyard',
      lostDesc: 'Key ring with 2022 Subaru key fob and 3 brass house keys on a navy alumni lanyard.',
      foundDesc: 'Set of vehicle keys on a blue fabric neck lanyard found near campus bike racks.',
      color: 'Black / Silver',
      brand: 'Subaru',
      location: 'Campus Coffee Commons',
      city: 'Cambridge',
      distinguishing: ['Red silicone bumper on fob', 'Small brass bottle opener'],
      privateClue: 'Brass key has engraved letter "H" and number 402',
    },
    {
      category: 'Documents & IDs',
      subcategory: 'Student ID Cards',
      lostTitle: 'Student Campus ID and Transit Pass Cardholder',
      foundTitle: 'Leather card sleeve with Student ID and MetroCard',
      lostDesc: 'Brown leather cardholder containing Harvard ID card and CharlieCard transit pass.',
      foundDesc: 'Leather minimalist wallet card sleeve found on seat in Lecture Hall B.',
      color: 'Brown',
      brand: 'Bellroy',
      location: 'Arts Pavillion Lecture Hall B',
      city: 'Cambridge',
      distinguishing: ['Embossed initials J.K.', 'Contains transit pass'],
      privateClue: 'Student ID number ends with 4981',
    },
    {
      category: 'Electronics',
      subcategory: 'Earbuds',
      lostTitle: 'AirPods Pro 2nd Gen in Sage Green Silicone Case',
      foundTitle: 'AirPods Pro Case with light green protective cover',
      lostDesc: 'Lost my AirPods Pro charging case in the Law reading room. White pods inside green case.',
      foundDesc: 'Apple wireless earbud case with green silicone jacket found on reading desk.',
      color: 'White / Sage Green',
      brand: 'Apple',
      location: 'Law School Reading Room',
      city: 'Boston',
      distinguishing: ['Tiny dinosaur charm on lanyard loop', 'Small dent on back lid'],
      privateClue: 'Engraved with initials "S.C." on the white inner plastic',
    },
    {
      category: 'Personal Accessories',
      subcategory: 'Eyewear',
      lostTitle: 'Tortoiseshell Ray-Ban Prescription Glasses',
      foundTitle: 'Ray-Ban Eyeglasses with Tortoiseshell Frame',
      lostDesc: 'Wayfarer style optical glasses in a brown leather Ray-Ban case left on computer desk.',
      foundDesc: 'Found designer optical glasses in hard snap case near printer station.',
      color: 'Tortoiseshell Brown',
      brand: 'Ray-Ban',
      location: 'North Quad Engineering Lab 204',
      city: 'Cambridge',
      distinguishing: ['RB 5154 model code on inner temple', 'Green microfiber cloth'],
      privateClue: 'Left lens has -2.75 prescription stamp on paper slip inside case',
    },
    {
      category: 'Personal Accessories',
      subcategory: 'Water Bottles',
      lostTitle: 'Hydro Flask 32oz Wide Mouth in Pacific Blue',
      foundTitle: 'Blue Insulated Metal Flask with outdoor stickers',
      lostDesc: 'Pacific blue vacuum insulated water bottle with boot guard and national park stickers.',
      foundDesc: 'Sticker-covered insulated metal drinking flask found by drinking fountain.',
      color: 'Pacific Blue',
      brand: 'Hydro Flask',
      location: 'Athletics Gym Locker Area',
      city: 'Boston',
      distinguishing: ['Yosemite Half Dome sticker', 'Yellow silicone flex boot'],
      privateClue: 'Owner phone number written in faint silver marker under rubber boot',
    },
    {
      category: 'Books & Stationery',
      subcategory: 'Notebooks',
      lostTitle: 'Black Moleskine Dot-Grid Hardcover Journal',
      foundTitle: 'Black Hardcover Elastic Notebook with sketches',
      lostDesc: 'A5 black dot grid sketchbook containing architectural sketches and capstone research ideas.',
      foundDesc: 'Black ribbon-bound sketchbook left on bench near architecture exhibition.',
      color: 'Black',
      brand: 'Moleskine',
      location: 'Arts Pavillion Lecture Hall B',
      city: 'Cambridge',
      distinguishing: ['Yellow ribbon marker', 'Rear pocket contains loose watercolor swatches'],
      privateClue: 'First page has dedication "For Studio VI - Autumn 2026"',
    },
    {
      category: 'Clothing & Footwear',
      subcategory: 'Jackets',
      lostTitle: 'Patagonia Better Sweater Fleece 1/4 Zip',
      foundTitle: 'Gray Knit Fleece Pullover on coat hook',
      lostDesc: 'Men’s Medium Stonewash gray fleece pullover left on the back of chair during seminar.',
      foundDesc: 'Gray fleece zipper top found on classroom coat rack after evening lecture.',
      color: 'Stonewash Gray',
      brand: 'Patagonia',
      location: 'Law School Reading Room',
      city: 'Boston',
      distinguishing: ['Small repair stitch on left elbow', 'Zippered chest pocket'],
      privateClue: 'Has university lapel pin attached inside chest pocket',
    },
    {
      category: 'Electronics',
      subcategory: 'Power Banks',
      lostTitle: 'Anker Prime 20,000mAh Power Bank with Screen',
      foundTitle: 'Anker Heavy Duty Portable Battery Pack with digital display',
      lostDesc: 'High-wattage black brick charger with digital battery percentage display and dual USB-C ports.',
      foundDesc: 'Found external battery pack plugged into wall outlet near cafeteria booth.',
      color: 'Black / Silver',
      brand: 'Anker',
      location: 'Medical Center Cafeteria',
      city: 'Boston',
      distinguishing: ['Includes short braided purple USB-C cable', 'Rubberized base'],
      privateClue: 'Displays 140W max output rating on base label',
    },
    {
      category: 'Personal Accessories',
      subcategory: 'Wallets',
      lostTitle: 'Navy Blue Leather Bi-Fold Wallet',
      foundTitle: 'Men\'s Dark Blue Leather Wallet found near ticket gate',
      lostDesc: 'Lost slim navy leather wallet near transit station entrance. Contains driver license and cards.',
      foundDesc: 'Dark blue wallet handed to transit station booth staff.',
      color: 'Navy Blue',
      brand: 'Fossil',
      location: 'Central Transit Hub Gate 3',
      city: 'Boston',
      distinguishing: ['Embossed anchor crest on front', 'RFID blocking badge inside'],
      privateClue: 'Contains transit pass ending in 8841 and AAA membership card',
    },
    {
      category: 'Electronics',
      subcategory: 'Kindle & E-Readers',
      lostTitle: 'Kindle Paperwhite 11th Gen with Fabric Cover',
      foundTitle: 'E-Reader in Denim Blue Magnetic Cover',
      lostDesc: '6.8 inch Kindle with warm light in dark blue water-safe fabric case. Left in lounge armchair.',
      foundDesc: 'Digital book reader found tucked between armchair cushions in student union.',
      color: 'Black / Denim Blue',
      brand: 'Amazon Kindle',
      location: 'Student Union Dining Hall',
      city: 'Boston',
      distinguishing: ['Matte screen protector applied', 'Small crease on cover corner'],
      privateClue: 'Device name: "Alex\'s 3rd Kindle" on settings screen',
    },
    {
      category: 'Personal Accessories',
      subcategory: 'Umbrellas',
      lostTitle: 'Windproof Compact Auto-Open Umbrella',
      foundTitle: 'Dark Navy Sturdy Folding Umbrella with wooden handle',
      lostDesc: 'Heavy-duty fiberglass umbrella with curved wooden handle. Left in umbrella stand by entrance.',
      foundDesc: 'Navy blue compact umbrella in lobby umbrella bin left after Friday rainstorm.',
      color: 'Dark Navy',
      brand: 'Blunt / Repel',
      location: 'Science Center Atrium',
      city: 'Cambridge',
      distinguishing: ['Curved maple wood grip', 'Reflective silver piping on edge'],
      privateClue: 'Inner label has written initials "R.M."',
    },
  ];

  // Insert the 15 paired items (15 Lost + 15 Found = 30 items)
  pairedItems.forEach((pair, idx) => {
    const daysAgoLost = 1 + (idx % 10);
    const daysAgoFound = Math.max(1, daysAgoLost - 1);

    const lostItem: Item = {
      id: `lost-demo-${String(idx + 1).padStart(2, '0')}`,
      type: 'lost',
      title: pair.lostTitle,
      category: pair.category,
      subcategory: pair.subcategory,
      description: pair.lostDesc,
      date: new Date(now.getTime() - daysAgoLost * 86400000).toISOString().split('T')[0],
      time: '14:30',
      location: pair.location,
      city: pair.city,
      coordinates: { lat: 42.3736 + idx * 0.002, lng: -71.1097 + idx * 0.002 },
      color: pair.color,
      brand: pair.brand,
      distinguishingFeatures: pair.distinguishing,
      contactMethod: 'In-app secure claim',
      images: pair.image
        ? [{ url: pair.image, isIllustrative: true, label: 'Illustrative reference' }]
        : [{ url: '', isIllustrative: false }],
      estimatedValue: '$50 - $1,500',
      reward: idx % 3 === 0 ? '$50 Reward for return' : undefined,
      sensitiveData: pair.category === 'Electronics' || pair.category === 'Documents & IDs',
      status: idx === 0 ? 'matched' : 'open',
      userId: users[2].id,
      userName: users[2].name,
      userEmail: users[2].email,
      isDemo: true,
      privateClues: {
        secretMarks: pair.privateClue,
        verificationQuestion: `Verify specific identifier or secret mark for this ${pair.brand} ${pair.subcategory}`,
      },
      createdAt: new Date(now.getTime() - daysAgoLost * 86400000).toISOString(),
      updatedAt: new Date(now.getTime() - daysAgoLost * 86400000).toISOString(),
    };

    const foundItem: Item = {
      id: `found-demo-${String(idx + 1).padStart(2, '0')}`,
      type: 'found',
      title: pair.foundTitle,
      category: pair.category,
      subcategory: pair.subcategory,
      description: pair.foundDesc,
      date: new Date(now.getTime() - daysAgoFound * 86400000).toISOString().split('T')[0],
      time: '16:45',
      location: pair.location,
      city: pair.city,
      coordinates: { lat: 42.3736 + idx * 0.002, lng: -71.1097 + idx * 0.002 },
      color: pair.color,
      brand: pair.brand,
      distinguishingFeatures: pair.distinguishing,
      contactMethod: 'Campus Security Desk / TraceBack Claim',
      images: pair.image
        ? [{ url: pair.image, isIllustrative: true, label: 'Illustrative reference' }]
        : [{ url: '', isIllustrative: false }],
      sensitiveData: pair.category === 'Electronics' || pair.category === 'Documents & IDs',
      status: idx === 0 ? 'claimed' : idx === 2 ? 'returned' : 'open',
      userId: users[1].id,
      userName: users[1].name,
      userEmail: users[1].email,
      isDemo: true,
      privateClues: {
        exactStorageLocation: 'Campus Security Facility Lockbox Cabinet B-04',
        handoverAvailability: 'Monday - Friday, 9:00 AM - 5:00 PM with student ID verification',
        secretMarks: pair.privateClue,
        verificationQuestion: `Verify specific identifier or secret mark for this ${pair.brand} ${pair.subcategory}`,
      },
      createdAt: new Date(now.getTime() - daysAgoFound * 86400000).toISOString(),
      updatedAt: new Date(now.getTime() - daysAgoFound * 86400000).toISOString(),
    };

    items.push(lostItem, foundItem);
  });

  // Additional 35 Lost reports to reach exactly 50 Lost reports
  const additionalLostTemplates = [
    { title: 'Graphing Calculator TI-84 Plus CE', cat: 'Electronics', sub: 'Calculators', brand: 'Texas Instruments', color: 'Mint Green', loc: 'Science Center Atrium' },
    { title: 'Black Bose QuietComfort Earbuds II', cat: 'Electronics', sub: 'Earbuds', brand: 'Bose', color: 'Triple Black', loc: 'South Dorms Laundry Room' },
    { title: 'Stanley Quencher H2.0 FlowState 40oz', cat: 'Personal Accessories', sub: 'Water Bottles', brand: 'Stanley', color: 'Rose Quartz Pink', loc: 'Athletics Gym Locker Area' },
    { title: 'Gold Heart Pendant Necklace', cat: 'Personal Accessories', sub: 'Jewelry', brand: 'Mejuri', color: '14k Yellow Gold', loc: 'Law School Reading Room' },
    { title: 'Fjallraven Kanken Classic Backpack', cat: 'Bags & Luggage', sub: 'Backpacks', brand: 'Fjallraven', color: 'Ox Red', loc: 'Campus Coffee Commons' },
    { title: 'Dorm Room Key with Red Tag #208', cat: 'Keys & Badges', sub: 'Room Keys', brand: 'Schlage', color: 'Brass / Red', loc: 'South Dorms Laundry Room' },
    { title: 'SteelSeries Wireless Gaming Mouse', cat: 'Electronics', sub: 'Computer Peripherals', brand: 'SteelSeries', color: 'Matte White', loc: 'North Quad Engineering Lab 204' },
    { title: 'Organic Chemistry Model Kit in Green Box', cat: 'Books & Stationery', sub: 'Study Aids', brand: 'Duluth Labs', color: 'Green / Multicolor', loc: 'Science Center Atrium' },
    { title: 'Black Nike Club Fleece Hoodie (L)', cat: 'Clothing & Footwear', sub: 'Hoodies', brand: 'Nike', color: 'Black', loc: 'Athletics Gym Locker Area' },
    { title: 'Silver iPad Air 5th Gen with Apple Pencil', cat: 'Electronics', sub: 'Tablets', brand: 'Apple', color: 'Starlight Silver', loc: 'Main Library 3rd Floor Quiet Study' },
    { title: 'Ray-Ban Aviator Sunglasses in Black Case', cat: 'Personal Accessories', sub: 'Eyewear', brand: 'Ray-Ban', color: 'Gold / G-15 Green', loc: 'Campus Coffee Commons' },
    { title: 'Fujifilm Instax Mini 12 Instant Camera', cat: 'Electronics', sub: 'Cameras', brand: 'Fujifilm', color: 'Pastel Blue', loc: 'Student Union Dining Hall' },
    { title: 'Matte Navy Lululemon Everywhere Belt Bag', cat: 'Bags & Luggage', sub: 'Waist Packs', brand: 'Lululemon', color: 'True Navy', loc: 'Athletics Gym Locker Area' },
    { title: 'Casio Vintage Digital Watch A168W', cat: 'Personal Accessories', sub: 'Watches', brand: 'Casio', color: 'Stainless Silver', loc: 'University Bookstore Counter' },
    { title: 'Yeti Rambler 20oz Tumbler with MagSlider', cat: 'Personal Accessories', sub: 'Drinkware', brand: 'Yeti', color: 'Seafoam', loc: 'Main Library 3rd Floor Quiet Study' },
    { title: 'Black Leather Zip Card Wallet with Key Ring', cat: 'Personal Accessories', sub: 'Wallets', brand: 'Coach', color: 'Black Pebble Leather', loc: 'Central Transit Hub Gate 3' },
    { title: 'North Face Borealis Commuter Daypack', cat: 'Bags & Luggage', sub: 'Backpacks', brand: 'The North Face', color: 'Asphalt Gray', loc: 'Arts Pavillion Lecture Hall B' },
    { title: 'Beats Studio Pro Wireless Headphones', cat: 'Electronics', sub: 'Headphones', brand: 'Beats', color: 'Deep Brown', loc: 'Campus Coffee Commons' },
    { title: 'Bicycle U-Lock with 2 Flat Keys', cat: 'Keys & Badges', sub: 'Bike Locks', brand: 'Kryptonite', color: 'Orange / Black', loc: 'Science Center Atrium' },
    { title: 'TI-Nspire CX II CAS Color Calculator', cat: 'Electronics', sub: 'Calculators', brand: 'Texas Instruments', color: 'Navy / White', loc: 'North Quad Engineering Lab 204' },
    { title: 'Columbia Waterproof Hooded Rain Shell', cat: 'Clothing & Footwear', sub: 'Jackets', brand: 'Columbia', color: 'Collegiate Navy', loc: 'Student Union Dining Hall' },
    { title: 'AirTag on Leather Key Ring Holder', cat: 'Electronics', sub: 'Trackers', brand: 'Apple', color: 'Saddle Brown', loc: 'Main Library 3rd Floor Quiet Study' },
    { title: 'Cambridge University Press Neuroscience Textbook', cat: 'Books & Stationery', sub: 'Textbooks', brand: 'Academic Press', color: 'Hardcover Blue', loc: 'Medical Center Cafeteria' },
    { title: 'Sony ZV-1 Vlogging Camera in Pouch', cat: 'Electronics', sub: 'Cameras', brand: 'Sony', color: 'Black', loc: 'Arts Pavillion Lecture Hall B' },
    { title: 'JBL Flip 6 Portable Bluetooth Speaker', cat: 'Electronics', sub: 'Speakers', brand: 'JBL', color: 'Squad Camo / Red', loc: 'North Quad Engineering Lab 204' },
    { title: 'Garmin Forerunner 255 GPS Running Watch', cat: 'Personal Accessories', sub: 'Watches', brand: 'Garmin', color: 'Slate Gray', loc: 'Athletics Gym Locker Area' },
    { title: 'Herschel Little America Mid-Volume Bag', cat: 'Bags & Luggage', sub: 'Backpacks', brand: 'Herschel Supply Co.', color: 'Forest Green', loc: 'Law School Reading Room' },
    { title: 'Logitech MX Master 3S Wireless Mouse', cat: 'Electronics', sub: 'Peripherals', brand: 'Logitech', color: 'Pale Gray', loc: 'Main Library 3rd Floor Quiet Study' },
    { title: 'Leather Bound Italian Fountain Pen Case', cat: 'Books & Stationery', sub: 'Pens', brand: 'Lamy', color: 'Cognac Brown', loc: 'Law School Reading Room' },
    { title: 'Dorm Laundry Card and Room FOB Clip', cat: 'Keys & Badges', sub: 'Fobs', brand: 'HID Global', color: 'Blue Plastic', loc: 'South Dorms Laundry Room' },
    { title: 'Osprey Daylite Plus Commuter Pack', cat: 'Bags & Luggage', sub: 'Backpacks', brand: 'Osprey', color: 'Black / Wave Blue', loc: 'Campus Coffee Commons' },
    { title: 'Fujitsu ScanSnap Mobile Document Scanner', cat: 'Electronics', sub: 'Scanners', brand: 'Fujitsu', color: 'White', loc: 'Science Center Atrium' },
    { title: 'Lululemon Daily Yoga Mat 5mm', cat: 'Personal Accessories', sub: 'Fitness', brand: 'Lululemon', color: 'Mulled Wine / Purple', loc: 'Athletics Gym Locker Area' },
    { title: 'Samsung Galaxy Buds2 Pro with Violet Case', cat: 'Electronics', sub: 'Earbuds', brand: 'Samsung', color: 'Bora Purple', loc: 'Student Union Dining Hall' },
    { title: 'Stainless Steel Travel Mug with Sip Lid', cat: 'Personal Accessories', sub: 'Drinkware', brand: 'Contigo', color: 'Brushed Steel', loc: 'Central Transit Hub Gate 3' },
  ];

  additionalLostTemplates.forEach((t, i) => {
    const num = 16 + i;
    const daysAgo = 2 + (i % 25);
    items.push({
      id: `lost-demo-${String(num).padStart(2, '0')}`,
      type: 'lost',
      title: t.title,
      category: t.cat,
      subcategory: t.sub,
      description: `Reported missing around ${t.loc}. Last seen during daytime study session. Important personal item.`,
      date: new Date(now.getTime() - daysAgo * 86400000).toISOString().split('T')[0],
      time: '11:15',
      location: t.loc,
      city: cities[i % cities.length],
      coordinates: { lat: 42.36 + (i * 0.003), lng: -71.09 + (i * 0.003) },
      color: t.color,
      brand: t.brand,
      distinguishingFeatures: ['Serial identification or stickers', 'Personal wear marks'],
      contactMethod: 'TraceBack message',
      images: [{ url: '', isIllustrative: false }],
      estimatedValue: '$30 - $450',
      sensitiveData: t.cat === 'Electronics' || t.cat === 'Documents & IDs',
      status: 'open',
      userId: users[2].id,
      userName: users[2].name,
      userEmail: users[2].email,
      isDemo: true,
      privateClues: {
        secretMarks: `Owner verification note for demo ${num}`,
        verificationQuestion: `Can you confirm any unique physical mark or serial on this ${t.brand}?`,
      },
      createdAt: new Date(now.getTime() - daysAgo * 86400000).toISOString(),
      updatedAt: new Date(now.getTime() - daysAgo * 86400000).toISOString(),
    });
  });

  // Additional 35 Found reports to reach exactly 50 Found reports
  const additionalFoundTemplates = [
    { title: 'Scientific Calculator TI-84 Plus in green sliding cover', cat: 'Electronics', sub: 'Calculators', brand: 'Texas Instruments', color: 'Mint Green', loc: 'Science Center Atrium' },
    { title: 'Black Wireless Earbuds Charging Pod (Bose)', cat: 'Electronics', sub: 'Earbuds', brand: 'Bose', color: 'Triple Black', loc: 'South Dorms Laundry Room' },
    { title: 'Pink Insulated 40oz Tumbler with Straw', cat: 'Personal Accessories', sub: 'Water Bottles', brand: 'Stanley', color: 'Rose Quartz Pink', loc: 'Athletics Gym Locker Area' },
    { title: 'Gold Delicate Chain Necklace with small pendant', cat: 'Personal Accessories', sub: 'Jewelry', brand: 'Unmarked', color: 'Yellow Gold Tone', loc: 'Law School Reading Room' },
    { title: 'Fjallraven Red Mini Backpack turned in to lost desk', cat: 'Bags & Luggage', sub: 'Backpacks', brand: 'Fjallraven', color: 'Ox Red', loc: 'Campus Coffee Commons' },
    { title: 'Single Brass Key on Red Plastic Tag', cat: 'Keys & Badges', sub: 'Room Keys', brand: 'Schlage', color: 'Brass / Red', loc: 'South Dorms Laundry Room' },
    { title: 'White RGB Gaming Mouse found on computer workstation', cat: 'Electronics', sub: 'Computer Peripherals', brand: 'SteelSeries', color: 'Matte White', loc: 'North Quad Engineering Lab 204' },
    { title: 'Chemistry Molecular Structure Ball & Stick Kit', cat: 'Books & Stationery', sub: 'Study Aids', brand: 'Duluth Labs', color: 'Green Plastic Casing', loc: 'Science Center Atrium' },
    { title: 'Black Heavyweight Fleece Pullover Hoodie', cat: 'Clothing & Footwear', sub: 'Hoodies', brand: 'Nike', color: 'Black', loc: 'Athletics Gym Locker Area' },
    { title: 'Silver Tablet Computer with Stylus Pen attached', cat: 'Electronics', sub: 'Tablets', brand: 'Apple', color: 'Silver', loc: 'Main Library 3rd Floor Quiet Study' },
    { title: 'Gold Frame Aviator Style Sunglasses in snap case', cat: 'Personal Accessories', sub: 'Eyewear', brand: 'Ray-Ban', color: 'Gold / Dark Tint', loc: 'Campus Coffee Commons' },
    { title: 'Blue Instant Print Camera with shoulder cord', cat: 'Electronics', sub: 'Cameras', brand: 'Fujifilm', color: 'Pastel Blue', loc: 'Student Union Dining Hall' },
    { title: 'Navy Zippered Crossbody Belt Bag', cat: 'Bags & Luggage', sub: 'Waist Packs', brand: 'Lululemon', color: 'Navy Blue', loc: 'Athletics Gym Locker Area' },
    { title: 'Vintage Style Steel Digital Watch with metal band', cat: 'Personal Accessories', sub: 'Watches', brand: 'Casio', color: 'Metallic Silver', loc: 'University Bookstore Counter' },
    { title: 'Seafoam Green Insulated Drink Tumbler with sliding lid', cat: 'Personal Accessories', sub: 'Drinkware', brand: 'Yeti', color: 'Seafoam', loc: 'Main Library 3rd Floor Quiet Study' },
    { title: 'Black Leather Card Sleeve with key loop', cat: 'Personal Accessories', sub: 'Wallets', brand: 'Coach', color: 'Black', loc: 'Central Transit Hub Gate 3' },
    { title: 'Dark Gray Daypack with bungee cord front', cat: 'Bags & Luggage', sub: 'Backpacks', brand: 'The North Face', color: 'Asphalt Gray', loc: 'Arts Pavillion Lecture Hall B' },
    { title: 'Over-Ear Brown Leatherette Headset', cat: 'Electronics', sub: 'Headphones', brand: 'Beats', color: 'Dark Mocha Brown', loc: 'Campus Coffee Commons' },
    { title: 'Bicycle Lock with Keys attached in bike rack', cat: 'Keys & Badges', sub: 'Bike Locks', brand: 'Kryptonite', color: 'Orange / Black', loc: 'Science Center Atrium' },
    { title: 'Graphing Calculator with Color Screen in slide cover', cat: 'Electronics', sub: 'Calculators', brand: 'Texas Instruments', color: 'Navy / White', loc: 'North Quad Engineering Lab 204' },
    { title: 'Navy Blue Lightweight Rain Jacket found on chair', cat: 'Clothing & Footwear', sub: 'Jackets', brand: 'Columbia', color: 'Navy', loc: 'Student Union Dining Hall' },
    { title: 'Round Bluetooth Tracker Tag in leather fob', cat: 'Electronics', sub: 'Trackers', brand: 'Apple', color: 'Brown Leather', loc: 'Main Library 3rd Floor Quiet Study' },
    { title: 'Hardcover Medical Sciences Textbook found on desk', cat: 'Books & Stationery', sub: 'Textbooks', brand: 'Academic Press', color: 'Blue Cover', loc: 'Medical Center Cafeteria' },
    { title: 'Compact Digital Camera in protective pouch', cat: 'Electronics', sub: 'Cameras', brand: 'Sony', color: 'Black', loc: 'Arts Pavillion Lecture Hall B' },
    { title: 'Camo Cylindrical Wireless Speaker', cat: 'Electronics', sub: 'Speakers', brand: 'JBL', color: 'Camouflage / Red', loc: 'North Quad Engineering Lab 204' },
    { title: 'Black Fitness Sports GPS Watch with silicone band', cat: 'Personal Accessories', sub: 'Watches', brand: 'Garmin', color: 'Dark Gray', loc: 'Athletics Gym Locker Area' },
    { title: 'Green Canvas Backpack with brown synthetic straps', cat: 'Bags & Luggage', sub: 'Backpacks', brand: 'Herschel Supply Co.', color: 'Forest Green', loc: 'Law School Reading Room' },
    { title: 'Ergonomic Gray Computer Mouse turned in to lab tech', cat: 'Electronics', sub: 'Peripherals', brand: 'Logitech', color: 'Light Gray', loc: 'Main Library 3rd Floor Quiet Study' },
    { title: 'Leather Zippered Writing Instrument Case', cat: 'Books & Stationery', sub: 'Pens', brand: 'Lamy', color: 'Brown Leather', loc: 'Law School Reading Room' },
    { title: 'Blue Electronic Access Keycard on plastic reel', cat: 'Keys & Badges', sub: 'Fobs', brand: 'HID Global', color: 'Blue', loc: 'South Dorms Laundry Room' },
    { title: 'Black Hiking Daypack found on bench', cat: 'Bags & Luggage', sub: 'Backpacks', brand: 'Osprey', color: 'Black / Blue trim', loc: 'Campus Coffee Commons' },
    { title: 'Compact Desktop Scanner handed in to admin', cat: 'Electronics', sub: 'Scanners', brand: 'Fujitsu', color: 'White', loc: 'Science Center Atrium' },
    { title: 'Rolled Burgundy Exercise Mat with strap', cat: 'Personal Accessories', sub: 'Fitness', brand: 'Lululemon', color: 'Deep Burgundy', loc: 'Athletics Gym Locker Area' },
    { title: 'Purple Wireless Earphones in charging cradle', cat: 'Electronics', sub: 'Earbuds', brand: 'Samsung', color: 'Lavender Purple', loc: 'Student Union Dining Hall' },
    { title: 'Insulated Stainless Coffee Travel Flask', cat: 'Personal Accessories', sub: 'Drinkware', brand: 'Contigo', color: 'Silver Metal', loc: 'Central Transit Hub Gate 3' },
  ];

  additionalFoundTemplates.forEach((t, i) => {
    const num = 16 + i;
    const daysAgo = 1 + (i % 20);
    items.push({
      id: `found-demo-${String(num).padStart(2, '0')}`,
      type: 'found',
      title: t.title,
      category: t.cat,
      subcategory: t.sub,
      description: `Discovered unattended near ${t.loc}. Deposited safely with facilities operations for verified owner claim.`,
      date: new Date(now.getTime() - daysAgo * 86400000).toISOString().split('T')[0],
      time: '14:20',
      location: t.loc,
      city: cities[i % cities.length],
      coordinates: { lat: 42.36 + (i * 0.003), lng: -71.09 + (i * 0.003) },
      color: t.color,
      brand: t.brand,
      distinguishingFeatures: ['Item logged in facility register', 'Safe custody verified'],
      contactMethod: 'Campus Facility Operations Desk',
      images: [{ url: '', isIllustrative: false }],
      sensitiveData: t.cat === 'Electronics' || t.cat === 'Documents & IDs',
      status: 'open',
      userId: users[1].id,
      userName: users[1].name,
      userEmail: users[1].email,
      isDemo: true,
      privateClues: {
        exactStorageLocation: `Campus Facility Storage Locker ${100 + num}`,
        handoverAvailability: 'Weekdays 09:00 - 17:00 at Campus Safety',
        secretMarks: `Facility verification log #${4000 + num}`,
        verificationQuestion: `Can you state unique contents or serial number for this ${t.brand}?`,
      },
      createdAt: new Date(now.getTime() - daysAgo * 86400000).toISOString(),
      updatedAt: new Date(now.getTime() - daysAgo * 86400000).toISOString(),
    });
  });

  return items;
}

export const db = new MemoryDatabase();
