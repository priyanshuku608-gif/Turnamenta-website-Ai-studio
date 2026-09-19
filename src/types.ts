export interface UserProfile {
  uid: string;
  displayName?: string;
  email?: string;
  photoURL?: string;
  depositBalance?: number;
  winningCash?: number;
  bonusCash?: number;
  balance?: number; // legacy/admin field
  totalMatches?: number;
  wonMatches?: number;
  totalEarnings?: number;
  referralEarnings?: number;
  referralCode?: string;
  referredBy?: string;
  referralPromptComplete?: boolean;
  joinedTournaments?: Record<string, boolean>;
  username?: string;
  gameUid?: string;
  isAdmin?: boolean;
  status?: string;
  createdAt?: number | string;
  lastLogin?: number | string;
  lastCheckedNotifications?: number | string;
  notifications?: Record<string, UserNotification>;
}

export interface UserNotification {
  id?: string;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'match_start' | 'deposit' | 'withdrawal';
  timestamp: number | string;
  read?: boolean;
}

export interface RegisteredPlayer {
  joinedAt: number | string;
  username: string;
  gameUid: string;
  teammateUsername?: string;
  teammateGameUid?: string;
}

export interface Tournament {
  id: string;
  gameId?: string;
  name: string;
  startTime: string | number;
  status: 'upcoming' | 'ongoing' | 'result' | 'completed' | 'cancelled';
  entryFee: number;
  prizePool: number;
  perKillPrize: number;
  maxPlayers: number;
  mode: 'Solo' | 'Duo' | 'Squad' | string;
  tags?: string[];
  description?: string;
  bannerUrl?: string;
  roomId?: string;
  roomPassword?: string;
  showIdPass?: boolean;
  prizeDistribution?: Record<string, number | string> | string;
  registeredPlayers?: Record<string, RegisteredPlayer>;
  createdAt?: number | string;
  updatedAt?: number | string;
}

export interface Game {
  id: string;
  name: string;
  imageUrl?: string;
  createdAt?: number | string;
}

export interface Promotion {
  id: string;
  imageUrl?: string;
  link?: string;
  title?: string;
  createdAt?: number | string;
}

export interface Deposit {
  id: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  amount: number;
  paymentMethod: string;
  upiId?: string;
  utr: string;
  status: 'pending' | 'approved' | 'rejected' | 'success';
  timestamp: number | string;
}

export interface Withdrawal {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  amount: number;
  methodDetails?: {
    methodName?: string;
    accountInfo?: string;
  };
  status: 'pending' | 'completed' | 'approved' | 'rejected';
  requestTimestamp: number | string;
}

export interface TransactionRecord {
  id: string;
  type: string;
  amount: number;
  timestamp: number | string;
  description?: string;
  status: string;
  balanceAfter?: number;
  adminUid?: string;
}

export interface AppSettings {
  appName?: string;
  logoUrl?: string;
  minWithdraw?: number;
  referralBonus?: number;
  signupBonus?: number;
  supportContact?: string;
  telegramLink?: string;
  upiDetails?: string;
  qrCodeUrl?: string;
  policyPrivacy?: string;
  policyTerms?: string;
  policyRefund?: string;
  policyFairPlay?: string;
  lastUpdated?: number | string;
}

export interface LeaderboardItem {
  uid: string;
  displayName: string;
  totalEarnings: number;
  wonMatches?: number;
  totalMatches?: number;
  photoURL?: string;
  rank?: number;
}

export type TabType = 'home' | 'wallet' | 'leaderboard' | 'profile';
