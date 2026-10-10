import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Clock3, Gift, RefreshCw, XCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { formatBDT } from '../utils/security';

interface ReferralAdminItem {
  id: string;
  referrerUid: string;
  referredUid: string;
  referrerEmail?: string;
  referredEmail?: string;
  amount: number;
  status: 'pending' | 'eligible' | 'approved' | 'rejected';
  createdAt?: string;
  eligibleAt?: string;
  approvedAt?: string;
  rejectionReason?: string;
}

export const ReferralAdminPanel: React.FC = () => {
  const { currentUser } = useAuth();
  const [items, setItems] = useState<ReferralAdminItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const request = useCallback(async (payload: Record<string, unknown>) => {
    if (!currentUser) throw new Error('Please sign in again.');
    const token = await currentUser.getIdToken();
    const response = await fetch('/.netlify/functions/referral', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Referral request failed.');
    return data;
  }, [currentUser]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await request({ action: 'list' });
      const now = Date.now();
      setItems((data.referrals || []).map((item: ReferralAdminItem) =>
        item.status === 'pending' && item.eligibleAt && new Date(item.eligibleAt).getTime() <= now
          ? { ...item, status: 'eligible' as const } : item
      ));
    } catch (e: any) {
      setError(e.message || 'Could not load referrals. Check Netlify function configuration.');
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => { void load(); }, [load]);

  const review = async (item: ReferralAdminItem, action: 'approve' | 'reject') => {
    let reason = '';
    if (action === 'reject') {
      reason = (window.prompt('Enter a reason for rejecting this referral:') || '').trim();
      if (!reason) return;
    }
    setBusyId(item.id);
    setError('');
    setNotice('');
    try {
      await request({ action, referralId: item.id, reason });
      setNotice(action === 'approve' ? `Approved ${formatBDT(item.amount)} referral bonus.` : 'Referral rejected.');
      await load();
    } catch (e: any) {
      setError(e.message || 'Could not update referral.');
    } finally {
      setBusyId('');
    }
  };

  const pendingCount = items.filter((item) => item.status === 'pending').length;
  const eligibleCount = items.filter((item) => item.status === 'eligible').length;
  const approvedTotal = items.filter((item) => item.status === 'approved').reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div><h2 className="text-xl font-black text-white">Referral Management</h2><p className="text-sm text-slate-400 mt-1">Review the 30-day eligibility period before approving BDT 100 bonuses.</p></div>
        <button onClick={() => void load()} disabled={loading} className="px-3 py-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-sm font-semibold text-white flex items-center gap-2"><RefreshCw className="w-4 h-4" /> Refresh</button>
      </div>
      {error && <div className="p-3 rounded-xl border border-red-800 bg-red-950/30 text-sm text-red-200">{error}</div>}
      {notice && <div className="p-3 rounded-xl border border-emerald-800 bg-emerald-950/30 text-sm text-emerald-200">{notice}</div>}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4"><Gift className="w-4 h-4 text-violet-300 mb-2" /><p className="text-xs text-slate-400">Total referrals</p><p className="text-2xl font-black text-white">{items.length}</p></div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4"><Clock3 className="w-4 h-4 text-amber-300 mb-2" /><p className="text-xs text-slate-400">Pending (30 days)</p><p className="text-2xl font-black text-amber-300">{pendingCount}</p></div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4"><CheckCircle2 className="w-4 h-4 text-cyan-300 mb-2" /><p className="text-xs text-slate-400">Eligible for review</p><p className="text-2xl font-black text-cyan-300">{eligibleCount}</p></div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4"><Gift className="w-4 h-4 text-emerald-300 mb-2" /><p className="text-xs text-slate-400">Approved total</p><p className="text-2xl font-black text-emerald-300">{formatBDT(approvedTotal)}</p></div>
      </div>
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {loading ? <div className="p-8 text-center text-slate-400">Loading referral records…</div> : items.length === 0 ? <div className="p-8 text-center text-slate-400">No referral records found.</div> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-950 text-xs uppercase text-slate-400"><tr><th className="p-4">Referrer</th><th className="p-4">New member</th><th className="p-4">Dates</th><th className="p-4">Bonus</th><th className="p-4">Status</th><th className="p-4">Action</th></tr></thead><tbody className="divide-y divide-slate-800">{items.map((item) => {
          const eligible = item.eligibleAt ? new Date(item.eligibleAt).getTime() <= Date.now() : false;
          const canReview = (item.status === 'pending' || item.status === 'eligible') && eligible;
          return <tr key={item.id} className="align-top"><td className="p-4"><p className="text-white">{item.referrerEmail || item.referrerUid.slice(0, 10)}</p><p className="text-xs text-slate-500">{item.referrerUid.slice(0, 10)}…</p></td><td className="p-4"><p className="text-white">{item.referredEmail || item.referredUid.slice(0, 10)}</p><p className="text-xs text-slate-500">{item.referredUid.slice(0, 10)}…</p></td><td className="p-4 text-xs text-slate-400"><p>Joined: {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '—'}</p><p className="mt-1">Eligible: {item.eligibleAt ? new Date(item.eligibleAt).toLocaleDateString() : '—'}</p></td><td className="p-4 font-bold text-white">{formatBDT(item.amount)}</td><td className="p-4"><span className={`inline-flex px-2 py-1 rounded-full text-xs font-bold border ${item.status === 'approved' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' : item.status === 'rejected' ? 'bg-red-500/10 text-red-300 border-red-500/20' : canReview ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20' : 'bg-amber-500/10 text-amber-300 border-amber-500/20'}`}>{canReview ? 'eligible' : item.status}</span>{item.rejectionReason && <p className="text-xs text-red-300 mt-1">{item.rejectionReason}</p>}</td><td className="p-4"><div className="flex gap-2">{canReview && <><button disabled={busyId === item.id} onClick={() => void review(item, 'approve')} className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white" title="Approve"><CheckCircle2 className="w-4 h-4" /></button><button disabled={busyId === item.id} onClick={() => void review(item, 'reject')} className="p-2 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white" title="Reject"><XCircle className="w-4 h-4" /></button></>}</div></td></tr>;
        })}</tbody></table></div>}
      </div>
      <p className="text-xs text-slate-500">Approval is enforced by the server: 30 full days must have passed, the new member must have a verified email and active account, and duplicate credits are rejected.</p>
    </div>
  );
};
