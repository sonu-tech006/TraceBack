export type UserRole = 'guest' | 'user' | 'moderator' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  organization?: string;
  bio?: string;
  createdAt: string;
}

export type ItemType = 'lost' | 'found';
export type ItemStatus = 'open' | 'matched' | 'claimed' | 'recovered' | 'returned' | 'closed' | 'archived';

export interface ItemImage {
  url: string;
  isIllustrative: boolean;
  label?: string;
}

export interface PrivateClues {
  serialNumber?: string;
  secretMarks?: string;
  contentsOrWallpaper?: string;
  exactStorageLocation?: string;
  handoverAvailability?: string;
  verificationQuestion?: string;
}

export interface Item {
  id: string;
  type: ItemType;
  title: string;
  category: string;
  subcategory: string;
  description: string;
  date: string;
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

export interface DashboardSummary {
  summary: {
    totalLost: number;
    totalFound: number;
    activeReports: number;
    potentialMatches: number;
    pendingClaims: number;
    itemsReturned: number;
    recoveryRate: number;
  };
  categoryDistribution: {
    name: string;
    lost: number;
    found: number;
    total: number;
  }[];
  topLocations: {
    location: string;
    count: number;
  }[];
  monthlyTrends: {
    month: string;
    lost: number;
    found: number;
    recovered: number;
  }[];
}
