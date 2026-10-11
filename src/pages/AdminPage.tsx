import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Users, 
  ArrowDownCircle, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Sparkles, 
  Plus, 
  Edit2, 
  Trash2, 
  FileText, 
  DollarSign, 
  RefreshCw, 
  AlertTriangle, 
  Check, 
  ExternalLink,
  Layers,
  Sliders,
  Play,
  Gift
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { 
  WithdrawalRequest, 
  UserProfile, 
  AdCard, 
  MonthlyReport, 
  AuditLog, 
  AdCategory 
} from '../types';
import { 
  fetchAllWithdrawalRequests, 
  fetchAllUsers, 
  updateUserAccountStatus, 
  fetchMonthlyReports, 
  saveMonthlyReport, 
  fetchAuditLogs, 
  computeAdminStats, 
  fetchAllAdClickStats,
  fetchAllWalletBalances,
  AdminStats
} from '../services/adminService';
import { 
  completeWithdrawalPayout, 
  rejectWithdrawalPayout, 
  creditCommissionToUser,
  adminCreditBalance
} from '../services/walletService';
import { 
  fetchAllAdCards, 
  saveAdCard, 
  deleteAdCard
} from '../services/adService';
import { formatBDT, isValidExternalUrl } from '../utils/security';
import { runAllSystemTests, TestResult } from '../utils/systemTests';
import { ReferralAdminPanel } from '../components/ReferralAdminPanel';

const DEFAULT_AD_IMAGES = [
  'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80'
];
const DEFAULT_AD_IMAGE = DEFAULT_AD_IMAGES[0];
const getDefaultAdImage = (index: number) => DEFAULT_AD_IMAGES[((index % DEFAULT_AD_IMAGES.length) + DEFAULT_AD_IMAGES.length) % DEFAULT_AD_IMAGES.length];

const AD_CATEGORIES: AdCategory[] = [
  'Technology',
  'Fashion',
  'Electronics',
  'Education',
  'Lifestyle',
  'Travel',
  'Food',
  'Entertainment',
  'Sponsored Offers',
  'Other Categories'
];

export const AdminPage: React.FC = () => {
  const { currentUser, isAdmin, t } = useAuth();

  const [activeTab, setActiveTab] = useState<'overview' | 'withdrawals' | 'ads' | 'revenue' | 'users' | 'audit' | 'tests' | 'referrals'>('overview');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [ads, setAds] = useState<AdCard[]>([]);
  const [reports, setReports] = useState<MonthlyReport[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [clickCounts, setClickCounts] = useState<Record<string, number>>({});
  const [walletBalances, setWalletBalances] = useState<Record<string, number>>({});
  const [creditAmounts, setCreditAmounts] = useState<Record<string, string>>({});
  const [creditNotes, setCreditNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(true);

  // Modals state
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRequest | null>(null);
  const [payoutModalMode, setPayoutModalMode] = useState<'complete' | 'reject' | null>(null);
  const [trxIdInput, setTrxIdInput] = useState('');
  const [adminNotesInput, setAdminNotesInput] = useState('');
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [actionError, setActionError] = useState('');

  // Ad card form modal state
  const [editingCard, setEditingCard] = useState<Partial<AdCard> | null>(null);
  const [showAdModal, setShowAdModal] = useState(false);
  const [adsterraLinks, setAdsterraLinks] = useState<string[]>(['']);

  // Commission modal
  const [showCommissionModal, setShowCommissionModal] = useState(false);
  const [commAmountInput, setCommAmountInput] = useState<number>(2500);
  const [commMonthInput, setCommMonthInput] = useState('October 2026');

  // Test suite state
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [runningTests, setRunningTests] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      loadAllAdminData();
    }
  }, [isAdmin]);

  const loadAllAdminData = async () => {
    setLoading(true);
    try {
      const [s, w, u, a, r, l, clickStats, balances] = await Promise.all([
        computeAdminStats(),
        fetchAllWithdrawalRequests(),
        fetchAllUsers(),
        fetchAllAdCards(),
        fetchMonthlyReports(),
        fetchAuditLogs(),
        fetchAllAdClickStats(),
        fetchAllWalletBalances()
      ]);
      setStats(s);
      setWithdrawals(w);
      setUsers(u);
      setAds(a);
      setReports(r);
      setAuditLogs(l);
      setClickCounts(Object.fromEntries(clickStats.map(item => [item.uid, Number(item.totalClicks || 0)])));
      setWalletBalances(balances);
    } catch (e) {
      console.error('Failed to load admin data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminBalanceCredit = async (userId: string) => {
    if (!currentUser?.email) {
      setActionError('Admin session is required.');
      return;
    }
    const amount = Number(creditAmounts[userId] || 0);
    if (!Number.isSafeInteger(amount) || amount <= 0) {
      setActionError('Enter a positive whole-number BDT amount.');
      return;
    }
    setIsProcessingAction(true);
    setActionError('');
    try {
      await adminCreditBalance(userId, amount, creditNotes[userId] || '', currentUser.email);
      setCreditAmounts(previous => ({ ...previous, [userId]: '' }));
      setCreditNotes(previous => ({ ...previous, [userId]: '' }));
      await loadAllAdminData();
      alert(`Successfully added ৳${amount.toLocaleString()} to the user's available balance.`);
    } catch (err: any) {
      setActionError(err.message || 'Could not add balance. Check Firestore rules deployment.');
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleCompletePayout = async () => {
    if (!selectedWithdrawal || !currentUser?.email) return;
    if (!trxIdInput.trim()) {
      setActionError('Transaction ID (TrxID) is required.');
      return;
    }
    setIsProcessingAction(true);
    setActionError('');
    try {
      await completeWithdrawalPayout(
        selectedWithdrawal.id,
        trxIdInput.trim(),
        adminNotesInput.trim(),
        currentUser.email
      );
      setPayoutModalMode(null);
      setSelectedWithdrawal(null);
      setTrxIdInput('');
      setAdminNotesInput('');
      await loadAllAdminData();
    } catch (err: any) {
      setActionError(err.message || 'Failed to complete payout');
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleRejectPayout = async () => {
    if (!selectedWithdrawal || !currentUser?.email) return;
    if (!adminNotesInput.trim()) {
      setActionError('A reason for rejection must be provided.');
      return;
    }
    setIsProcessingAction(true);
    setActionError('');
    try {
      await rejectWithdrawalPayout(
        selectedWithdrawal.id,
        adminNotesInput.trim(),
        currentUser.email
      );
      setPayoutModalMode(null);
      setSelectedWithdrawal(null);
      setAdminNotesInput('');
      await loadAllAdminData();
    } catch (err: any) {
      setActionError(err.message || 'Failed to reject payout');
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleSaveAdCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCard) return;
    setIsProcessingAction(true);
    setActionError('');
    try {
      const cardToSave = { ...editingCard, imageUrl: editingCard.imageUrl || DEFAULT_AD_IMAGE };
      await saveAdCard(cardToSave);
      setShowAdModal(false);
      setEditingCard(null);
      await loadAllAdminData();
    } catch (err: any) {
      setActionError(err.message || 'Failed to save ad card');
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleAddAdsterraLinks = async () => {
    const links = adsterraLinks.map(link => link.trim()).filter(Boolean);
    if (links.length === 0) {
      setActionError('Add at least one Adsterra link.');
      return;
    }
    const invalidLink = links.find(link => !isValidExternalUrl(link));
    if (invalidLink) {
      setActionError('One or more links are invalid. Use a complete https:// or http:// URL.');
      return;
    }

    setIsProcessingAction(true);
    setActionError('');
    try {
      await Promise.all(links.map((destinationUrl, index) => saveAdCard({
        title: `Adsterra Ad ${ads.length + index + 1}`,
        titleBn: 'বিজ্ঞাপন',
        description: 'Sponsored offer. Click to visit the advertiser.',
        descriptionBn: 'বিজ্ঞাপনটি দেখতে ক্লিক করুন।',
        category: 'Sponsored Offers',
        imageUrl: getDefaultAdImage(ads.length + index),
        destinationUrl,
        isSponsored: true,
        isActive: true,
        displayOrder: ads.length + index + 1,
        openInNewTab: true
      })));
      setAdsterraLinks(['']);
      await loadAllAdminData();
      alert(`Successfully added ${links.length} Adsterra ad card(s).`);
    } catch (err: any) {
      setActionError(err.message || 'Failed to save Adsterra links.');
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleAssignDistinctAdImages = async () => {
    const linkedAds = ads.filter(ad => Boolean(ad.destinationUrl) && (ad.isSponsored || ad.category === 'Sponsored Offers'));
    if (linkedAds.length === 0) {
      alert('No linked Adsterra/sponsored cards found.');
      return;
    }
    if (!confirm(`Assign different default images to ${linkedAds.length} linked ad card(s)?`)) return;

    setIsProcessingAction(true);
    setActionError('');
    try {
      await Promise.all(linkedAds.map((ad, index) => saveAdCard({
        ...ad,
        imageUrl: getDefaultAdImage(index),
        updatedAt: new Date().toISOString()
      })));
      await loadAllAdminData();
      alert(`Updated images for ${linkedAds.length} linked ad card(s).`);
    } catch (err: any) {
      setActionError(err.message || 'Failed to assign different ad images.');
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleDeleteCard = async (id: string) => {
    if (confirm('Are you sure you want to delete this ad card?')) {
      try {
        await deleteAdCard(id);
        await loadAllAdminData();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleDistributeCommission = async () => {
    if (!currentUser?.email) return;
    setIsProcessingAction(true);
    try {
      // Credit verified commission to all active publishers
      const activePublishers = users.filter(u => u.status === 'active' && u.role === 'user');
      for (const pub of activePublishers) {
        await creditCommissionToUser(
          pub.uid,
          commAmountInput,
          commMonthInput,
          `Adsterra Verified Net Revenue Share (${commMonthInput})`,
          currentUser.email
        );
      }
      setShowCommissionModal(false);
      await loadAllAdminData();
      alert(`Successfully credited ৳${commAmountInput} to ${activePublishers.length} active publishers!`);
    } catch (err: any) {
      alert(err.message || 'Commission disbursement failed');
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleRunTests = async () => {
    setRunningTests(true);
    try {
      const res = await runAllSystemTests();
      setTestResults(res);
    } finally {
      setRunningTests(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center max-w-lg mx-auto my-12">
        <Lock className="w-12 h-12 text-amber-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Restricted Access</h2>
        <p className="text-sm text-slate-400">
          This portal is reserved for authorized EarnBD administrators. Access is verified using server-enforced security rules.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 font-bold uppercase tracking-wider border border-amber-500/30">
              Admin Shield Active
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {currentUser?.email}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            {t('adminTitle')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {t('adminSubtitle')}
          </p>
        </div>

        <button
          onClick={loadAllAdminData}
          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-2 self-start sm:self-auto text-xs font-semibold"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Sync Real-Time Data</span>
        </button>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none border-b border-slate-800">
        {[
          { id: 'overview', label: t('tabOverview'), icon: Sliders },
          { id: 'withdrawals', label: `${t('tabWithdrawals')} (${withdrawals.filter(w => w.status === 'pending').length})`, icon: ArrowDownCircle },
          { id: 'ads', label: t('tabAds'), icon: Sparkles },
          { id: 'revenue', label: t('tabCommissions'), icon: DollarSign },
          { id: 'users', label: `${t('tabUsers')} (${users.length})`, icon: Users },
          { id: 'referrals', label: 'Referrals', icon: Gift },
          { id: 'audit', label: t('tabAudit'), icon: FileText },
          { id: 'tests', label: t('tabTests'), icon: Play },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap flex items-center gap-2 transition ${
                activeTab === tab.id
                  ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 1. OVERVIEW TAB */}
      {activeTab === 'overview' && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
              <span className="text-xs text-slate-400 block font-medium">Pending Payouts</span>
              <div className="text-xl sm:text-2xl font-black text-amber-400 mt-1">
                {formatBDT(stats.pendingRequestsSum)}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                {stats.pendingRequestsCount} requests awaiting manual dispatch
              </span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
              <span className="text-xs text-slate-400 block font-medium">Total Paid Out</span>
              <div className="text-xl sm:text-2xl font-black text-emerald-400 mt-1">
                {formatBDT(stats.totalPaidSum)}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Dispatched via bKash & Nagad
              </span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
              <span className="text-xs text-slate-400 block font-medium">Registered Publishers</span>
              <div className="text-xl sm:text-2xl font-black text-white mt-1">
                {stats.totalUsers}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                {stats.activeUsers} Active • {stats.suspendedUsers} Suspended
              </span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
              <span className="text-xs text-slate-400 block font-medium">Verified Ad Revenue</span>
              <div className="text-xl sm:text-2xl font-black text-cyan-400 mt-1">
                {formatBDT(stats.totalVerifiedRevenue)}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Audited network receipts
              </span>
            </div>

          </div>

          {/* Quick Actions Panel */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6">
            <h3 className="text-base font-bold text-white mb-4">Quick Financial Actions</h3>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setActiveTab('withdrawals')}
                className="px-4 py-2.5 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2"
              >
                <ArrowDownCircle className="w-4 h-4" />
                <span>Review Pending Payouts ({stats.pendingRequestsCount})</span>
              </button>
              <button
                onClick={() => {
                  setEditingCard({
                    title: '',
                    titleBn: '',
                    description: '',
                    descriptionBn: '',
                    category: 'Technology',
                    imageUrl: getDefaultAdImage(ads.length),
                    destinationUrl: '',
                    isSponsored: false,
                    isActive: true,
                    displayOrder: ads.length + 1,
                    openInNewTab: true
                  });
                  setShowAdModal(true);
                }}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Ad / Sponsor Card</span>
              </button>
              <button
                onClick={() => setShowCommissionModal(true)}
                className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2"
              >
                <DollarSign className="w-4 h-4" />
                <span>Disburse Verified Monthly Revenue</span>
              </button>
              <button
                onClick={handleRunTests}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-2"
              >
                <Play className="w-4 h-4 text-emerald-400" />
                <span>Execute System Rules Suite</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. WITHDRAWALS TAB */}
      {activeTab === 'withdrawals' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">
              Withdrawal Queue & Manual bKash / Nagad Fulfillment
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              Total Requests: {withdrawals.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider font-bold">
                <tr>
                  <th className="p-3">Req ID / Date</th>
                  <th className="p-3">User Email</th>
                  <th className="p-3">Wallet</th>
                  <th className="p-3">Payout Destination</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">TrxID / Reason</th>
                  <th className="p-3 text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {withdrawals.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500">
                      No withdrawal requests in queue.
                    </td>
                  </tr>
                ) : (
                  withdrawals.map((w) => (
                    <tr key={w.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-3 font-mono">
                        <div className="font-bold text-white">{w.id.slice(0, 10)}...</div>
                        <div className="text-[10px] text-slate-500">
                          {new Date(w.requestedAt).toLocaleString()}
                        </div>
                      </td>
                      <td className="p-3 text-slate-300">{w.userEmail}</td>
                      <td className="p-3 font-bold text-white flex items-center gap-1.5 mt-2">
                        <span className={`w-2 h-2 rounded-full ${w.walletType === 'bKash' ? 'bg-[#e2136e]' : w.walletType === 'Nagad' ? 'bg-[#f7931e]' : 'bg-[#f0b90b]'}`} />
                        {w.walletType}
                      </td>
                      <td className="p-3 font-mono text-emerald-400 font-semibold">{w.walletNumber}</td>
                      <td className="p-3 font-black text-white text-sm">{formatBDT(w.amount)}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          w.status === 'paid' ? 'bg-emerald-500/20 text-emerald-400' :
                          w.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                          'bg-amber-500/20 text-amber-300'
                        }`}>
                          {w.status}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-[11px] text-slate-400">
                        {w.transactionRef ? (
                          <span className="text-emerald-400 font-bold">{w.transactionRef}</span>
                        ) : w.adminNotes ? (
                          <span className="text-red-400">{w.adminNotes}</span>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        {w.status === 'pending' || w.status === 'processing' ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setSelectedWithdrawal(w);
                                setPayoutModalMode('complete');
                                setTrxIdInput('');
                                setAdminNotesInput('');
                              }}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-[11px] transition"
                            >
                              Send & Record TrxID
                            </button>
                            <button
                              onClick={() => {
                                setSelectedWithdrawal(w);
                                setPayoutModalMode('reject');
                                setAdminNotesInput('');
                              }}
                              className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg text-[11px] transition"
                            >
                              Reject & Refund
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500 italic">Locked</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. ADS & DIRECTORY TAB */}
      {activeTab === 'ads' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">
                Ad Directory & Sponsor Cards Manager
              </h3>
              <p className="text-xs text-slate-400">
                Configure thumbnail images, titles, descriptions, categories, and safe destination URLs.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleAssignDistinctAdImages}
                disabled={isProcessingAction}
                className="px-3 py-2 bg-cyan-700 hover:bg-cyan-600 text-white rounded-xl text-xs font-semibold disabled:opacity-50"
              >
                {isProcessingAction ? 'Updating Images...' : 'Assign Different Images'}
              </button>

              <button
                onClick={() => {
                  setEditingCard({
                    title: '',
                    titleBn: '',
                    description: '',
                    descriptionBn: '',
                    category: 'Technology',
                    imageUrl: getDefaultAdImage(ads.length),
                    destinationUrl: '',
                    isSponsored: true,
                    isActive: true,
                    displayOrder: ads.length + 1,
                    openInNewTab: true
                  });
                  setShowAdModal(true);
                }}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Ad Card</span>
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-500/30 bg-slate-950/70 p-4 sm:p-5 space-y-4">
            <div>
              <h4 className="font-bold text-white text-base">Add Multiple Adsterra Links</h4>
              <p className="text-xs text-slate-400 mt-1">
                Add as many links as you need. Each link creates one ad card using the same built-in default image. No image upload or Firebase Storage required.
              </p>
            </div>

            <div className="space-y-2">
              {adsterraLinks.map((link, index) => (
                <div key={index} className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-[10px] uppercase tracking-wide text-slate-500 block mb-1">Adsterra Link {index + 1}</label>
                    <input
                      type="url"
                      value={link}
                      onChange={(e) => setAdsterraLinks(current => current.map((item, i) => i === index ? e.target.value : item))}
                      placeholder="https://..."
                      className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-white text-xs font-mono outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    aria-label={`Remove link ${index + 1}`}
                    disabled={adsterraLinks.length === 1}
                    onClick={() => setAdsterraLinks(current => current.filter((_, i) => i !== index))}
                    className="self-end px-3 py-2.5 bg-slate-800 hover:bg-red-950 text-slate-300 rounded-xl disabled:opacity-30"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {actionError && (
              <div className="p-2.5 bg-red-950/40 border border-red-800 rounded-lg text-xs text-red-200">{actionError}</div>
            )}

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setAdsterraLinks(current => [...current, ''])}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Add Another Link
              </button>
              <button
                type="button"
                onClick={handleAddAdsterraLinks}
                disabled={isProcessingAction || adsterraLinks.every(link => !link.trim())}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold disabled:opacity-50"
              >
                {isProcessingAction ? 'Saving Links...' : `Save ${adsterraLinks.filter(link => link.trim()).length} Link(s) & Create Cards`}
              </button>
            </div>
            <p className="text-[10px] text-slate-500">Every saved link gets one card with the same default thumbnail. Cards can be edited, disabled, or deleted below.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ads.map((ad) => (
              <div 
                key={ad.id}
                className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between p-4"
              >
                <div>
                  <div className="relative aspect-video rounded-xl overflow-hidden mb-3 bg-slate-900">
                    <img src={ad.imageUrl} alt={ad.title} className="w-full h-full object-cover" />
                    <span className="absolute top-2 left-2 text-[10px] font-bold bg-slate-900/90 text-emerald-400 px-2 py-0.5 rounded">
                      {ad.category}
                    </span>
                    {ad.isSponsored && (
                      <span className="absolute top-2 right-2 text-[10px] font-bold bg-amber-500 text-slate-950 px-2 py-0.5 rounded">
                        Sponsored
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-white text-sm line-clamp-1">{ad.title}</h4>
                  <p className="text-xs text-slate-400 line-clamp-2 mt-1">{ad.description}</p>
                  {ad.destinationUrl && (
                    <div className="text-[10px] text-cyan-400 font-mono truncate mt-2">
                      🔗 {ad.destinationUrl}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 mt-3 text-xs">
                  <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                    ad.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {ad.isActive ? 'Active' : 'Inactive'}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingCard(ad);
                        setShowAdModal(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteCard(ad.id)}
                      className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. REVENUE & COMMISSION TAB */}
      {activeTab === 'revenue' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-white">Monthly Verified Revenue Reports</h3>
                <p className="text-xs text-slate-400">
                  Track external verified advertising receipts (e.g., Adsterra) and publisher allocations.
                </p>
              </div>
              <button
                onClick={() => setShowCommissionModal(true)}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold"
              >
                Disburse Publisher Share
              </button>
            </div>

            <div className="space-y-3">
              {reports.map((rep) => (
                <div key={rep.id} className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex justify-between items-center text-xs">
                  <div>
                    <h4 className="text-sm font-bold text-white">{rep.monthYear}</h4>
                    <span className="text-slate-400">Rate: {rep.commissionRate}% Publisher Allocation</span>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-extrabold text-emerald-400">
                      {formatBDT(rep.verifiedRevenue)}
                    </div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">{rep.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. USERS TAB */}
      {activeTab === 'users' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <h3 className="text-lg font-bold text-white mb-2">
            Registered Publishers, Click Counts & Wallet Management
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Click counts are recorded ad-card/image clicks, not verified ad-network impressions. Use Add Balance to credit a user's withdrawable wallet; minimum withdrawal is ৳3,000.
          </p>
          {actionError && <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">{actionError}</div>}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3">User</th>
                  <th className="p-3">Email / UID</th>
                  <th className="p-3">Role / Status</th>
                  <th className="p-3">Ad Image Clicks</th>
                  <th className="p-3">Available Balance</th>
                  <th className="p-3">Add BDT</th>
                  <th className="p-3">Admin Note (optional)</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {users.map((u) => (
                  <tr key={u.uid} className="hover:bg-slate-800/40 align-top">
                    <td className="p-3 font-bold text-white">{u.displayName || 'Publisher'}</td>
                    <td className="p-3">
                      <div className="text-slate-300">{u.email}</div>
                      <div className="font-mono text-[10px] text-slate-500">{u.uid}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-semibold uppercase text-[10px] text-cyan-400">{u.role}</div>
                      <span className={`mt-1 inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        u.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                      }`}>{u.status}</span>
                    </td>
                    <td className="p-3 text-center">
                      <span className="inline-flex min-w-12 justify-center rounded-lg bg-cyan-500/10 px-3 py-2 text-sm font-black text-cyan-300">{(clickCounts[u.uid] || 0).toLocaleString()}</span>
                    </td>
                    <td className="p-3 whitespace-nowrap font-bold text-emerald-300">{formatBDT(walletBalances[u.uid] || 0)}</td>
                    <td className="p-3">
                      {u.role !== 'admin' && <input
                        type="number" min="1" step="1" inputMode="numeric"
                        value={creditAmounts[u.uid] || ''}
                        onChange={e => setCreditAmounts(previous => ({ ...previous, [u.uid]: e.target.value }))}
                        placeholder="e.g. 3000"
                        className="w-28 rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-2 text-white outline-none focus:border-emerald-500"
                        aria-label={`Balance credit amount for ${u.email}`}
                      />}
                    </td>
                    <td className="p-3">
                      {u.role !== 'admin' && <input
                        type="text" maxLength={160}
                        value={creditNotes[u.uid] || ''}
                        onChange={e => setCreditNotes(previous => ({ ...previous, [u.uid]: e.target.value }))}
                        placeholder="Reason / reference"
                        className="w-40 rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-2 text-white outline-none focus:border-emerald-500"
                        aria-label={`Admin note for ${u.email}`}
                      />}
                    </td>
                    <td className="p-3">
                      <div className="flex flex-col items-start gap-2">
                        {u.role !== 'admin' && <button
                          disabled={isProcessingAction || !creditAmounts[u.uid]}
                          onClick={() => handleAdminBalanceCredit(u.uid)}
                          className="rounded-lg bg-emerald-600 px-3 py-2 text-[11px] font-bold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40 whitespace-nowrap"
                        >Add Balance</button>}
                        {u.role !== 'admin' && <button
                          onClick={async () => {
                            const newStatus = u.status === 'active' ? 'suspended' : 'active';
                            if (currentUser?.email) {
                              await updateUserAccountStatus(u.uid, newStatus, currentUser.email);
                              await loadAllAdminData();
                            }
                          }}
                          className={`rounded-lg px-3 py-1.5 text-[11px] font-bold ${
                            u.status === 'active'
                              ? 'bg-red-950 text-red-300 border border-red-800'
                              : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          }`}
                        >{u.status === 'active' ? 'Suspend' : 'Activate'}</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. AUDIT LOGS TAB */}
      {activeTab === 'audit' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <h3 className="text-lg font-bold text-white mb-2">Immutable Security Audit Trail</h3>
          <p className="text-xs text-slate-400 mb-4">
            Every administrative payout completion, rejection refund, and commission distribution is permanently logged.
          </p>
          <div className="space-y-2.5">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs flex justify-between items-start gap-4">
                <div>
                  <div className="font-bold text-white flex items-center gap-2">
                    <span className="text-emerald-400 font-mono">[{log.action}]</span>
                    <span className="text-slate-400 font-normal">by {log.actorEmail}</span>
                  </div>
                  <p className="text-slate-300 mt-1 leading-relaxed">{log.details}</p>
                </div>
                <div className="text-[10px] text-slate-500 font-mono whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. SYSTEM & RULES TESTS TAB */}
      {activeTab === 'referrals' && <ReferralAdminPanel />}

      {activeTab === 'tests' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">System Security & Rules Test Suite</h3>
              <p className="text-xs text-slate-400">
                Exercises the 5 critical financial and security invariants required by EarnBD specifications.
              </p>
            </div>
            <button
              onClick={handleRunTests}
              disabled={runningTests}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              <span>{runningTests ? 'Running Suite...' : 'Run All Tests'}</span>
            </button>
          </div>

          <div className="space-y-3">
            {testResults.length === 0 ? (
              <div className="p-8 text-center bg-slate-950 rounded-2xl border border-slate-800 text-slate-400 text-xs">
                Click "Run All Tests" to verify minimum withdrawal thresholds, balance reservation logic, rejection refunds, duplicate idempotency checks, and URL security.
              </div>
            ) : (
              testResults.map((t) => (
                <div key={t.id} className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {t.passed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                      )}
                      <h4 className="text-sm font-bold text-white">{t.name}</h4>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400">
                        {t.durationMs}ms
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{t.description}</p>
                    <p className="text-xs text-emerald-400 font-mono mt-1">{t.message}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                    t.passed ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                  }`}>
                    {t.passed ? 'PASSED' : 'FAILED'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* MODAL: COMPLETE / REJECT PAYOUT */}
      {payoutModalMode && selectedWithdrawal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0f172a] border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">
              {payoutModalMode === 'complete' ? t('markPaidModalTitle') : t('rejectModalTitle')}
            </h3>

            <div className="p-3 bg-slate-900 rounded-xl text-xs space-y-1 text-slate-300">
              <div>Amount: <strong className="text-white">{formatBDT(selectedWithdrawal.amount)}</strong></div>
              <div>Destination: <strong className="text-white">{selectedWithdrawal.walletType}</strong> ({selectedWithdrawal.walletType === 'Binance' ? 'UID' : 'mobile'}: {selectedWithdrawal.walletNumber})</div>
              <div>User: {selectedWithdrawal.userEmail}</div>
            </div>

            {actionError && (
              <div className="p-2.5 bg-red-950/40 border border-red-800 rounded-lg text-xs text-red-200">
                {actionError}
              </div>
            )}

            {payoutModalMode === 'complete' ? (
              <div>
                <label className="text-xs font-bold uppercase text-slate-300 block mb-1">
                  {t('trxIdLabel')}
                </label>
                <input
                  type="text"
                  value={trxIdInput}
                  onChange={(e) => setTrxIdInput(e.target.value)}
                  placeholder={t('trxIdPlaceholder')}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-white font-mono text-sm outline-none"
                  required
                />
              </div>
            ) : (
              <div>
                <label className="text-xs font-bold uppercase text-slate-300 block mb-1">
                  {t('rejectReasonLabel')}
                </label>
                <textarea
                  value={adminNotesInput}
                  onChange={(e) => setAdminNotesInput(e.target.value)}
                  placeholder={t('rejectReasonPlaceholder')}
                  rows={3}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl p-3 text-white text-xs outline-none"
                  required
                />
                <p className="text-[11px] text-amber-300 mt-1">
                  Reserved ৳{selectedWithdrawal.amount} will be refunded to user's available balance.
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => { setPayoutModalMode(null); setSelectedWithdrawal(null); }}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={payoutModalMode === 'complete' ? handleCompletePayout : handleRejectPayout}
                disabled={isProcessingAction}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold text-white ${
                  payoutModalMode === 'complete'
                    ? 'bg-emerald-500 hover:bg-emerald-600'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {isProcessingAction ? 'Processing...' : (payoutModalMode === 'complete' ? 'Confirm Payment' : 'Confirm Reject & Refund')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT AD CARD */}
      {showAdModal && editingCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0f172a] border border-slate-700 w-full max-w-xl rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
            <h3 className="text-lg font-bold text-white">
              {editingCard.id ? 'Edit Directory Card' : 'Create Directory / Ad Card'}
            </h3>

            {actionError && (
              <div className="p-2.5 bg-red-950/40 border border-red-800 rounded-lg text-xs text-red-200">
                {actionError}
              </div>
            )}

            <form onSubmit={handleSaveAdCard} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Title (EN)</label>
                  <input
                    type="text"
                    value={editingCard.title || ''}
                    onChange={(e) => setEditingCard({ ...editingCard, title: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Title (Bangla)</label>
                  <input
                    type="text"
                    value={editingCard.titleBn || ''}
                    onChange={(e) => setEditingCard({ ...editingCard, titleBn: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Description (EN)</label>
                <textarea
                  value={editingCard.description || ''}
                  onChange={(e) => setEditingCard({ ...editingCard, description: e.target.value })}
                  rows={2}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Category</label>
                  <select
                    value={editingCard.category || 'Technology'}
                    onChange={(e) => setEditingCard({ ...editingCard, category: e.target.value as AdCategory })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none"
                  >
                    {AD_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Display Order</label>
                  <input
                    type="number"
                    value={editingCard.displayOrder || 1}
                    onChange={(e) => setEditingCard({ ...editingCard, displayOrder: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
                <label className="text-slate-300 font-bold block mb-1">Default Thumbnail Image</label>
                <div className="flex items-center gap-3">
                  <img src={editingCard.imageUrl || DEFAULT_AD_IMAGE} alt="Default ad thumbnail" className="w-24 h-16 rounded-lg object-cover bg-slate-950" />
                  <p className="text-[11px] text-slate-400">No upload required. New ad cards automatically use the built-in default image, so Firebase Storage is not used.</p>
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Adsterra Direct Link / Destination URL</label>
                <input
                  type="url"
                  value={editingCard.destinationUrl || ''}
                  onChange={(e) => setEditingCard({ ...editingCard, destinationUrl: e.target.value })}
                  placeholder="Paste your Adsterra Direct Link (https://...)"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none font-mono"
                />
                <p className="text-[10px] text-slate-500 mt-1">Paste the Adsterra Direct Link here. A script/embed snippet is not a clickable destination URL.</p>
              </div>

              {/* Toggles */}
              <div className="flex gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={editingCard.isSponsored || false}
                    onChange={(e) => setEditingCard({ ...editingCard, isSponsored: e.target.checked })}
                    className="rounded bg-slate-900 border-slate-800"
                  />
                  <span>Sponsored Label</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={editingCard.isActive !== false}
                    onChange={(e) => setEditingCard({ ...editingCard, isActive: e.target.checked })}
                    className="rounded bg-slate-900 border-slate-800"
                  />
                  <span>Active & Visible</span>
                </label>
              </div>

              {/* Live Preview */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 mt-2">
                <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Live Card Preview</span>
                <div className="flex gap-3 items-center">
                  <img src={editingCard.imageUrl || DEFAULT_AD_IMAGE} alt="preview" className="w-16 h-12 object-cover rounded-lg bg-slate-900" />
                  <div>
                    <h5 className="font-bold text-white text-xs">{editingCard.title || 'Untitled Card'}</h5>
                    <span className="text-[10px] text-emerald-400 font-semibold">{editingCard.category}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => { setShowAdModal(false); setActionError(''); }}
                  className="flex-1 py-2.5 bg-slate-800 text-slate-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessingAction}
                  className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold"
                >
                  {isProcessingAction ? 'Saving...' : 'Save & Publish Card'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DISBURSE COMMISSION */}
      {showCommissionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0f172a] border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4 text-xs">
            <h3 className="text-lg font-bold text-white">Disburse Verified Publisher Commission</h3>
            <p className="text-slate-400">
              Calculates and credits monthly publisher revenue shares directly to all active publisher wallets using atomic Firestore transactions.
            </p>

            <div>
              <label className="text-slate-300 font-bold block mb-1">Cycle Month / Year</label>
              <input
                type="text"
                value={commMonthInput}
                onChange={(e) => setCommMonthInput(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none"
              />
            </div>

            <div>
              <label className="text-slate-300 font-bold block mb-1">Commission Amount per Publisher (BDT)</label>
              <input
                type="number"
                value={commAmountInput}
                onChange={(e) => setCommAmountInput(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold outline-none"
              />
            </div>

            <div className="flex gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowCommissionModal(false)}
                className="flex-1 py-2.5 bg-slate-800 text-slate-300 rounded-xl font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDistributeCommission}
                disabled={isProcessingAction}
                className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-bold"
              >
                {isProcessingAction ? 'Disbursing...' : 'Disburse Now'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
