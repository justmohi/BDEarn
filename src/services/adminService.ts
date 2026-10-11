import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  updateDoc, 
  query, 
  orderBy, 
  limit, 
  where 
} from 'firebase/firestore';
import { db } from '../firebase';
import { 
  WithdrawalRequest, 
  UserProfile, 
  MonthlyReport, 
  AuditLog, 
  AppSettings,
  UserWallet 
} from '../types';

export async function fetchAllWithdrawalRequests(): Promise<WithdrawalRequest[]> {
  try {
    const q = query(collection(db, 'withdrawalRequests'), orderBy('requestedAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as WithdrawalRequest);
  } catch (err) {
    console.error('Error fetching withdrawal requests:', err);
    return [];
  }
}

export async function fetchAllUsers(): Promise<UserProfile[]> {
  try {
    const snap = await getDocs(collection(db, 'users'));
    return snap.docs.map(d => d.data() as UserProfile);
  } catch (err) {
    console.error('Error fetching users:', err);
    return [];
  }
}

export async function updateUserAccountStatus(
  userId: string, 
  newStatus: 'active' | 'suspended',
  adminEmail: string
): Promise<void> {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    status: newStatus,
    updatedAt: new Date().toISOString()
  });

  const auditRef = doc(db, 'auditLogs', `log_${Date.now()}`);
  await setDoc(auditRef, {
    id: auditRef.id,
    actorId: 'admin',
    actorEmail: adminEmail,
    action: 'USER_STATUS_UPDATED',
    details: `Updated user ${userId} status to ${newStatus}`,
    timestamp: new Date().toISOString()
  });
}

export async function fetchMonthlyReports(): Promise<MonthlyReport[]> {
  try {
    const q = query(collection(db, 'monthlyReports'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as MonthlyReport);
  } catch (err) {
    console.error('Error fetching monthly reports:', err);
    return [];
  }
}

export async function saveMonthlyReport(reportData: Partial<MonthlyReport>): Promise<void> {
  const reportId = reportData.id || `rep_${Date.now()}`;
  const reportRef = doc(db, 'monthlyReports', reportId);
  const payload: MonthlyReport = {
    id: reportId,
    monthYear: reportData.monthYear || new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }),
    verifiedRevenue: reportData.verifiedRevenue || 0,
    commissionRate: reportData.commissionRate || 65,
    distributedAmount: reportData.distributedAmount || 0,
    status: reportData.status || 'draft',
    notes: reportData.notes || '',
    createdAt: reportData.createdAt || new Date().toISOString()
  };
  await setDoc(reportRef, payload, { merge: true });
}

export async function fetchAuditLogs(maxLogs: number = 50): Promise<AuditLog[]> {
  try {
    const q = query(collection(db, 'auditLogs'), orderBy('timestamp', 'desc'), limit(maxLogs));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as AuditLog);
  } catch (err) {
    console.error('Error fetching audit logs:', err);
    return [];
  }
}

export async function fetchAppSettings(): Promise<AppSettings> {
  try {
    const snap = await getDocs(collection(db, 'appSettings'));
    if (!snap.empty) {
      return snap.docs[0].data() as AppSettings;
    }
  } catch (err) {
    console.warn('Could not fetch appSettings, using defaults:', err);
  }
  return {
    minWithdrawalAmount: 3000,
    commissionPercentage: 65,
    allowWithdrawals: true,
    noticeEn: 'EarnBD is fully compliant with publisher terms.',
    noticeBn: 'EarnBD সম্পূর্ণ নীতিমালার আলোকে পরিচালিত।'
  };
}

export async function updateAppSettings(settings: Partial<AppSettings>): Promise<void> {
  const settingRef = doc(db, 'appSettings', 'global');
  await setDoc(settingRef, settings, { merge: true });
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  pendingRequestsCount: number;
  pendingRequestsSum: number;
  totalPaidSum: number;
  totalVerifiedRevenue: number;
}

export async function computeAdminStats(): Promise<AdminStats> {
  const [users, requests, reports] = await Promise.all([
    fetchAllUsers(),
    fetchAllWithdrawalRequests(),
    fetchMonthlyReports()
  ]);

  const activeUsers = users.filter(u => u.status === 'active').length;
  const suspendedUsers = users.filter(u => u.status === 'suspended').length;

  const pendingRequests = requests.filter(r => r.status === 'pending' || r.status === 'processing');
  const pendingRequestsSum = pendingRequests.reduce((acc, r) => acc + (r.amount || 0), 0);

  const paidRequests = requests.filter(r => r.status === 'paid');
  const totalPaidSum = paidRequests.reduce((acc, r) => acc + (r.amount || 0), 0);

  const totalVerifiedRevenue = reports.reduce((acc, r) => acc + (r.verifiedRevenue || 0), 0);

  return {
    totalUsers: users.length,
    activeUsers,
    suspendedUsers,
    pendingRequestsCount: pendingRequests.length,
    pendingRequestsSum,
    totalPaidSum,
    totalVerifiedRevenue
  };
}


export interface AdClickStats {
  uid: string;
  totalClicks: number;
  lastClickedAdId?: string;
  lastClickedAt?: unknown;
}

export async function fetchAllAdClickStats(): Promise<AdClickStats[]> {
  try {
    const snap = await getDocs(collection(db, 'adClickStats'));
    return snap.docs.map(d => ({ uid: d.id, ...d.data() } as AdClickStats));
  } catch (err) {
    console.error('Error fetching ad click statistics:', err);
    return [];
  }
}

export async function fetchAllWalletBalances(): Promise<Record<string, number>> {
  try {
    const snap = await getDocs(collection(db, 'wallets'));
    return Object.fromEntries(snap.docs.map(d => [d.id, Number(d.data().availableBalance || 0)]));
  } catch (err) {
    console.error('Error fetching wallet balances:', err);
    return {};
  }
}
