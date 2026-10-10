export type UserRole = 'user' | 'admin';
export type UserStatus = 'active' | 'suspended';

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  phoneNumber?: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface UserWallet {
  uid: string;
  availableBalance: number;
  reservedBalance: number;
  pendingCommission: number;
  lifetimeApproved: number;
  paidCommission: number;
  currentMonthApproved: number;
  previousMonthApproved: number;
  updatedAt: string;
}

export type AdCategory = 
  | 'Technology'
  | 'Fashion'
  | 'Electronics'
  | 'Education'
  | 'Lifestyle'
  | 'Travel'
  | 'Food'
  | 'Entertainment'
  | 'Sponsored Offers'
  | 'Other Categories';

export interface AdCard {
  id: string;
  title: string;
  titleBn?: string;
  description: string;
  descriptionBn?: string;
  imageUrl: string;
  category: AdCategory;
  destinationUrl?: string;
  isSponsored?: boolean;
  isActive: boolean;
  displayOrder?: number;
  openInNewTab?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export type WithdrawalStatus = 'pending' | 'processing' | 'approved' | 'paid' | 'rejected';
export type WalletType = 'bKash' | 'Nagad';

export interface WithdrawalRequest {
  id: string;
  userId: string;
  userEmail: string;
  walletType: WalletType;
  walletNumber: string;
  amount: number;
  status: WithdrawalStatus;
  adminNotes?: string;
  transactionRef?: string;
  requestedAt: string;
  processedAt?: string;
}

export type TransactionType = 
  | 'commission_credit'
  | 'withdrawal_reserve'
  | 'withdrawal_payout'
  | 'withdrawal_refund'
  | 'adjustment';

export interface WalletTransaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  status: 'completed' | 'pending' | 'cancelled';
  description: string;
  referenceId?: string;
  idempotencyKey: string;
  createdAt: string;
}

export interface MonthlyReport {
  id: string;
  monthYear: string; // e.g. "2026-10" or "October 2026"
  verifiedRevenue: number;
  commissionRate: number; // e.g. 65 for 65%
  distributedAmount: number;
  status: 'draft' | 'published' | 'finalized';
  notes?: string;
  createdAt: string;
}

export interface Commission {
  id: string;
  userId: string;
  monthYear: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  notes?: string;
  idempotencyKey: string;
  createdAt: string;
}

export interface AppSettings {
  minWithdrawalAmount: number; // Default 5000
  commissionPercentage: number; // Default 65%
  allowWithdrawals: boolean;
  noticeEn?: string;
  noticeBn?: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorEmail: string;
  action: string;
  details: string;
  timestamp: string;
}
