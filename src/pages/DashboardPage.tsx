import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  ArrowDownCircle, 
  Clock, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  Layers, 
  FileText, 
  ShieldCheck, 
  ArrowUpRight, 
  ArrowDownRight,
  RefreshCw,
  MousePointerClick
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { WithdrawalRequest, WalletTransaction } from '../types';
import { collection, query, where, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { formatBDT } from '../utils/security';
import { MIN_WITHDRAWAL_BDT } from '../services/walletService';
import { ReferralPanel } from '../components/ReferralPanel';

interface DashboardPageProps {
  onOpenWithdraw: () => void;
  onOpenAuth: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onOpenWithdraw,
  onOpenAuth,
}) => {
  const { currentUser, wallet, refreshWallet, t } = useAuth();
  
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'withdrawals' | 'transactions' | 'statement'>('withdrawals');
  const [adImageClicks, setAdImageClicks] = useState<number>(0);

  useEffect(() => {
    if (currentUser) {
      loadHistory();
    }
  }, [currentUser]);

  const loadHistory = async () => {
    if (!currentUser) return;
    setLoadingHistory(true);
    try {
      // Load this user's image/card click counter.
      try {
        const clickStats = await getDoc(doc(db, 'adClickStats', currentUser.uid));
        setAdImageClicks(clickStats.exists() ? Number(clickStats.data().totalClicks || 0) : 0);
      } catch (clickError) {
        console.warn('Ad click stats load notice:', clickError);
      }

      // 1. Fetch user withdrawals
      const wQuery = query(
        collection(db, 'withdrawalRequests'),
        where('userId', '==', currentUser.uid),
        orderBy('requestedAt', 'desc')
      );
      const wSnap = await getDocs(wQuery);
      setWithdrawals(wSnap.docs.map(d => d.data() as WithdrawalRequest));

      // 2. Fetch user wallet transactions
      const txQuery = query(
        collection(db, 'walletTransactions'),
        where('userId', '==', currentUser.uid),
        orderBy('createdAt', 'desc')
      );
      const txSnap = await getDocs(txQuery);
      setTransactions(txSnap.docs.map(d => d.data() as WalletTransaction));
    } catch (e) {
      console.warn('History load notice:', e);
    } finally {
      setLoadingHistory(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-12 text-center max-w-xl mx-auto my-12">
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
          <Wallet className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Publisher Dashboard</h2>
        <p className="text-sm text-slate-300 mb-6">
          Sign in to view your approved lifetime earnings, withdrawable balance, and bKash / Nagad payment history.
        </p>
        <button
          onClick={onOpenAuth}
          className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/20 transition"
        >
          {t('login')}
        </button>
      </div>
    );
  }

  const availableBalance = wallet?.availableBalance || 0;
  const reservedBalance = wallet?.reservedBalance || 0;
  const lifetimeApproved = wallet?.lifetimeApproved || 0;
  const paidCommission = wallet?.paidCommission || 0;
  const currentMonthApproved = wallet?.currentMonthApproved || 0;
  const previousMonthApproved = wallet?.previousMonthApproved || 0;
  const currentMonthLabel = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const previousMonthDate = new Date();
  previousMonthDate.setDate(1);
  previousMonthDate.setMonth(previousMonthDate.getMonth() - 1);
  const previousMonthLabel = previousMonthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const isEligibleForWithdrawal = availableBalance >= MIN_WITHDRAWAL_BDT;
  const progressPercent = Math.min(100, Math.round((availableBalance / MIN_WITHDRAWAL_BDT) * 100));
  const remainingNeeded = Math.max(0, MIN_WITHDRAWAL_BDT - availableBalance);

  return (
    <div className="space-y-8">
      
      {/* Header with live sync button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Publisher Ledger
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700 font-mono">
              UID: {currentUser.uid.slice(0, 8)}...
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            {t('dashboardTitle')}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={async () => {
              await refreshWallet();
              await loadHistory();
            }}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            title="Refresh Ledger"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          
          <button
            onClick={onOpenWithdraw}
            disabled={!isEligibleForWithdrawal}
            className={`px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition ${
              isEligibleForWithdrawal
                ? 'bg-pink-600 hover:bg-pink-700 text-white shadow-lg shadow-pink-600/20'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            }`}
          >
            <ArrowDownCircle className="w-4 h-4" />
            <span>{t('submitWithdrawalBtn')}</span>
          </button>
        </div>
      </div>

      {/* 1. PROMINENT MINIMUM WITHDRAWAL PROGRESS CARD */}
      <div className="bg-gradient-to-br from-[#0e1630] via-[#0f172a] to-[#0c1222] border border-slate-700/80 rounded-3xl p-6 sm:p-7 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-pink-400 mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>{t('withdrawalGoalTitle')} (৳3,000 BDT)</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white">
              {isEligibleForWithdrawal ? (
                <span className="text-emerald-400">{t('eligibleToWithdraw')}</span>
              ) : (
                <span>{t('needMoreToWithdraw', { remaining: remainingNeeded.toLocaleString() })}</span>
              )}
            </h3>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              {t('minWithdrawalNotice')}
            </p>
          </div>

          <div className="text-right shrink-0">
            <span className="text-xs text-slate-400 block font-medium">Available Withdrawable</span>
            <span className="text-2xl sm:text-3xl font-black text-emerald-400">
              {formatBDT(availableBalance)}
            </span>
          </div>
        </div>

        {/* Progress bar towards ৳3,000 */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-semibold text-slate-300">
            <span>Current: {formatBDT(availableBalance)}</span>
            <span>Target: ৳3,000 BDT ({progressPercent}%)</span>
          </div>
          <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
            <div 
              className={`h-full transition-all duration-700 rounded-full ${
                progressPercent >= 100 
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400' 
                  : 'bg-gradient-to-r from-pink-500 via-amber-400 to-emerald-400'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Ad image click count: counts clicks made while signed in, not verified network impressions. */}
      <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl flex items-center justify-between gap-4">
        <div>
          <div className="text-xs font-medium text-slate-400 mb-2">Ad Image Clicks</div>
          <div className="text-2xl font-black text-cyan-400">{adImageClicks.toLocaleString()}</div>
          <p className="text-[11px] text-slate-500 mt-1">Your recorded ad-card/image clicks</p>
        </div>
        <div className="w-11 h-11 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
          <MousePointerClick className="w-5 h-5" />
        </div>
      </div>

      {/* 2. STATS & EARNINGS METRICS GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        
        {/* Available Balance */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">{t('withdrawableBalance')}</span>
            <Wallet className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-400">
            {formatBDT(availableBalance)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Ready for bKash/Nagad</div>
        </div>

        {/* Reserved in Processing */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Reserved in Processing</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-400">
            {formatBDT(reservedBalance)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Pending payout transfer</div>
        </div>

        {/* Lifetime Approved */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">{t('lifetimeApproved')}</span>
            <TrendingUp className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-white">
            {formatBDT(lifetimeApproved)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Cumulative audited earnings</div>
        </div>

        {/* Paid Commission */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">{t('paidCommission')}</span>
            <CheckCircle2 className="w-4 h-4 text-pink-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-pink-400">
            {formatBDT(paidCommission)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Dispatched via mobile wallets</div>
        </div>

        {/* Current Month Approved */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">{t('currentMonthEarnings')}</span>
            <Calendar className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-200">
            {formatBDT(currentMonthApproved)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">{currentMonthLabel} share</div>
        </div>

        {/* Previous Month Carryover */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">{t('previousMonthEarnings')}</span>
            <Layers className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-200">
            {formatBDT(previousMonthApproved)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Rolled into current balance</div>
        </div>

      </div>

      {/* 3. TABS: WITHDRAWAL HISTORY, TRANSACTIONS & MONTHLY STATEMENT */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-5 overflow-x-auto">
          <button
            onClick={() => setActiveTab('withdrawals')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
              activeTab === 'withdrawals'
                ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ArrowDownCircle className="w-4 h-4" />
            <span>{t('withdrawalHistory')} ({withdrawals.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
              activeTab === 'transactions'
                ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>{t('transactionHistory')} ({transactions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('statement')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
              activeTab === 'statement'
                ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>{t('monthlyStatements')}</span>
          </button>
        </div>

        {/* Tab 1: Withdrawal Requests */}
        {activeTab === 'withdrawals' && (
          <div>
            {loadingHistory ? (
              <div className="py-8 text-center text-slate-500 text-xs">Loading requests...</div>
            ) : withdrawals.length === 0 ? (
              <div className="py-10 text-center text-slate-400">
                <ArrowDownCircle className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                <p className="text-sm font-medium">{t('noWithdrawalsYet')}</p>
                <p className="text-xs text-slate-500 mt-1">
                  Once your balance reaches ৳3,000, you can request bKash or Nagad payouts here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider font-bold">
                    <tr>
                      <th className="p-3">Date</th>
                      <th className="p-3">Wallet</th>
                      <th className="p-3">Account Number</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">TrxID / Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {withdrawals.map((w) => (
                      <tr key={w.id} className="hover:bg-slate-800/40 transition">
                        <td className="p-3 whitespace-nowrap text-slate-400">
                          {new Date(w.requestedAt).toLocaleDateString()}
                        </td>
                        <td className="p-3 font-bold text-white flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${w.walletType === 'bKash' ? 'bg-[#e2136e]' : 'bg-[#f7931e]'}`} />
                          {w.walletType}
                        </td>
                        <td className="p-3 font-mono text-emerald-400 font-medium">
                          {w.walletNumber}
                        </td>
                        <td className="p-3 font-extrabold text-white">
                          {formatBDT(w.amount)}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            w.status === 'paid' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                            w.status === 'rejected' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                            w.status === 'processing' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' :
                            'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}>
                            {w.status}
                          </span>
                        </td>
                        <td className="p-3 text-slate-400 font-mono text-[11px]">
                          {w.transactionRef ? (
                            <span className="text-emerald-400 font-bold">TrxID: {w.transactionRef}</span>
                          ) : w.adminNotes ? (
                            <span className="text-red-400">{w.adminNotes}</span>
                          ) : (
                            <span className="text-slate-500">In Queue</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Transactions Ledger */}
        {activeTab === 'transactions' && (
          <div>
            {loadingHistory ? (
              <div className="py-8 text-center text-slate-500 text-xs">Loading ledger...</div>
            ) : transactions.length === 0 ? (
              <div className="py-10 text-center text-slate-400">
                <FileText className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                <p className="text-sm font-medium">{t('noTransactionsYet')}</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {transactions.map((tx) => (
                  <div 
                    key={tx.id}
                    className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                        tx.type === 'commission_credit' || tx.type === 'withdrawal_refund' || tx.type === 'referral_bonus'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-pink-500/10 text-pink-400 border border-pink-500/20'
                      }`}>
                        {tx.type === 'commission_credit' || tx.type === 'withdrawal_refund' ? (
                          <ArrowDownRight className="w-4 h-4" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white capitalize">
                          {tx.description || tx.type.replace('_', ' ')}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {new Date(tx.createdAt).toLocaleString()} • Idemp: {tx.idempotencyKey.slice(0, 15)}...
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-extrabold ${
                        tx.type === 'commission_credit' || tx.type === 'withdrawal_refund'
                          ? 'text-emerald-400'
                          : 'text-pink-400'
                      }`}>
                        {tx.type === 'commission_credit' || tx.type === 'withdrawal_refund' ? '+' : '-'}
                        {formatBDT(tx.amount)}
                      </div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold">
                        {tx.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Monthly Statement */}
        {activeTab === 'statement' && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800">
              <h4 className="text-sm font-bold text-white mb-2">{currentMonthLabel} Accounting Summary</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block">Gross Publisher Share</span>
                  <span className="text-sm font-bold text-white">{formatBDT(lifetimeApproved)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Payouts Dispatched</span>
                  <span className="text-sm font-bold text-pink-400">{formatBDT(paidCommission)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Reserved</span>
                  <span className="text-sm font-bold text-amber-400">{formatBDT(reservedBalance)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Net Carryforward</span>
                  <span className="text-sm font-bold text-emerald-400">{formatBDT(availableBalance)}</span>
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              EarnBD utilizes an immutable ledger model where all financial balance modifications are strictly backed by atomic transactions. Unpaid balances rollover automatically each calendar month.
            </p>
          </div>
        )}

      </div>

      <ReferralPanel />
    </div>
  );
};
        
        {/* Available Balance */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">{t('withdrawableBalance')}</span>
            <Wallet className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-400">
            {formatBDT(availableBalance)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Ready for bKash/Nagad</div>
        </div>

        {/* Reserved in Processing */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Reserved in Processing</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-400">
            {formatBDT(reservedBalance)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Pending payout transfer</div>
        </div>

        {/* Lifetime Approved */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">{t('lifetimeApproved')}</span>
            <TrendingUp className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-white">
            {formatBDT(lifetimeApproved)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Cumulative audited earnings</div>
        </div>

        {/* Paid Commission */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">{t('paidCommission')}</span>
            <CheckCircle2 className="w-4 h-4 text-pink-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-pink-400">
            {formatBDT(paidCommission)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Dispatched via mobile wallets</div>
        </div>

        {/* Current Month Approved */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">{t('currentMonthEarnings')}</span>
            <Calendar className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-200">
            {formatBDT(currentMonthApproved)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">October 2026 share</div>
        </div>

        {/* Previous Month Carryover */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">{t('previousMonthEarnings')}</span>
            <Layers className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-200">
            {formatBDT(previousMonthApproved)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Rolled into current balance</div>
        </div>

      </div>

      {/* 3. TABS: WITHDRAWAL HISTORY, TRANSACTIONS & MONTHLY STATEMENT */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-5 overflow-x-auto">
          <button
            onClick={() => setActiveTab('withdrawals')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
              activeTab === 'withdrawals'
                ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ArrowDownCircle className="w-4 h-4" />
            <span>{t('withdrawalHistory')} ({withdrawals.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
              activeTab === 'transactions'
                ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>{t('transactionHistory')} ({transactions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('statement')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
              activeTab === 'statement'
                ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>{t('monthlyStatements')}</span>
          </button>
        </div>

        {/* Tab 1: Withdrawal Requests */}
        {activeTab === 'withdrawals' && (
          <div>
            {loadingHistory ? (
              <div className="py-8 text-center text-slate-500 text-xs">Loading requests...</div>
            ) : withdrawals.length === 0 ? (
              <div className="py-10 text-center text-slate-400">
                <ArrowDownCircle className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                <p className="text-sm font-medium">{t('noWithdrawalsYet')}</p>
                <p className="text-xs text-slate-500 mt-1">
                  Once your balance reaches ৳3,000, you can request bKash or Nagad payouts here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider font-bold">
                    <tr>
                      <th className="p-3">Date</th>
                      <th className="p-3">Wallet</th>
                      <th className="p-3">Account Number</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">TrxID / Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {withdrawals.map((w) => (
                      <tr key={w.id} className="hover:bg-slate-800/40 transition">
                        <td className="p-3 whitespace-nowrap text-slate-400">
                          {new Date(w.requestedAt).toLocaleDateString()}
                        </td>
                        <td className="p-3 font-bold text-white flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${w.walletType === 'bKash' ? 'bg-[#e2136e]' : 'bg-[#f7931e]'}`} />
                          {w.walletType}
                        </td>
                        <td className="p-3 font-mono text-emerald-400 font-medium">
                          {w.walletNumber}
                        </td>
                        <td className="p-3 font-extrabold text-white">
                          {formatBDT(w.amount)}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            w.status === 'paid' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                            w.status === 'rejected' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                            w.status === 'processing' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' :
                            'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}>
                            {w.status}
                          </span>
                        </td>
                        <td className="p-3 text-slate-400 font-mono text-[11px]">
                          {w.transactionRef ? (
                            <span className="text-emerald-400 font-bold">TrxID: {w.transactionRef}</span>
                          ) : w.adminNotes ? (
                            <span className="text-red-400">{w.adminNotes}</span>
                          ) : (
                            <span className="text-slate-500">In Queue</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Transactions Ledger */}
        {activeTab === 'transactions' && (
          <div>
            {loadingHistory ? (
              <div className="py-8 text-center text-slate-500 text-xs">Loading ledger...</div>
            ) : transactions.length === 0 ? (
              <div className="py-10 text-center text-slate-400">
                <FileText className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                <p className="text-sm font-medium">{t('noTransactionsYet')}</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {transactions.map((tx) => (
                  <div 
                    key={tx.id}
                    className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                        tx.type === 'commission_credit' || tx.type === 'withdrawal_refund' || tx.type === 'referral_bonus'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-pink-500/10 text-pink-400 border border-pink-500/20'
                      }`}>
                        {tx.type === 'commission_credit' || tx.type === 'withdrawal_refund' ? (
                          <ArrowDownRight className="w-4 h-4" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white capitalize">
                          {tx.description || tx.type.replace('_', ' ')}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {new Date(tx.createdAt).toLocaleString()} • Idemp: {tx.idempotencyKey.slice(0, 15)}...
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-extrabold ${
                        tx.type === 'commission_credit' || tx.type === 'withdrawal_refund'
                          ? 'text-emerald-400'
                          : 'text-pink-400'
                      }`}>
                        {tx.type === 'commission_credit' || tx.type === 'withdrawal_refund' ? '+' : '-'}
                        {formatBDT(tx.amount)}
                      </div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold">
                        {tx.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Monthly Statement */}
        {activeTab === 'statement' && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800">
              <h4 className="text-sm font-bold text-white mb-2">October 2026 Accounting Summary</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block">Gross Publisher Share</span>
                  <span className="text-sm font-bold text-white">{formatBDT(lifetimeApproved)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Payouts Dispatched</span>
                  <span className="text-sm font-bold text-pink-400">{formatBDT(paidCommission)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Reserved</span>
                  <span className="text-sm font-bold text-amber-400">{formatBDT(reservedBalance)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Net Carryforward</span>
                  <span className="text-sm font-bold text-emerald-400">{formatBDT(availableBalance)}</span>
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              EarnBD utilizes an immutable ledger model where all financial balance modifications are strictly backed by atomic transactions. Unpaid balances rollover automatically each calendar month.
            </p>
          </div>
        )}

      </div>

      <ReferralPanel />
    </div>
  );
};
