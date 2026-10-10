import React, { useEffect, useMemo, useState } from 'react';
import { Copy, Gift, Users, Clock3, CheckCircle2, Share2, ExternalLink } from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { formatBDT } from '../utils/security';

type ReferralStatus = 'pending' | 'eligible' | 'approved' | 'rejected';
interface ReferralItem {
  id: string;
  referrerUid: string;
  referredUid: string;
  amount: number;
  status: ReferralStatus;
  createdAt: any;
  eligibleAt: any;
  rejectionReason?: string | null;
}

const asDate = (value: any): Date | null => {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const ReferralPanel: React.FC = () => {
  const { currentUser } = useAuth();
  const [items, setItems] = useState<ReferralItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!currentUser) return;
    let alive = true;
    const load = async () => {
      setLoading(true);
      try {
        const snap = await getDocs(query(collection(db, 'referrals'), where('referrerUid', '==', currentUser.uid)));
        if (!alive) return;
        const now = Date.now();
        const next = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ReferralItem))
          .sort((a, b) => (asDate(b.createdAt)?.getTime() || 0) - (asDate(a.createdAt)?.getTime() || 0))
          .map((item) => item.status === 'pending' && (asDate(item.eligibleAt)?.getTime() || Infinity) <= now
            ? { ...item, status: 'eligible' as const } : item);
        setItems(next);
      } catch (error) {
        console.error('Could not load referrals:', error);
        setMessage('Referral history could not be loaded. Please check Firebase rules and try again.');
      } finally {
        if (alive) setLoading(false);
      }
    };
    void load();
    return () => { alive = false; };
  }, [currentUser]);

  const referralUrl = useMemo(() => {
    if (!currentUser || typeof window === 'undefined') return '';
    const url = new URL(window.location.origin + '/');
    url.searchParams.set('ref', currentUser.uid);
    return url.toString();
  }, [currentUser]);

  if (!currentUser) return null;

  const pending = items.filter((item) => item.status === 'pending').length;
  const eligible = items.filter((item) => item.status === 'eligible').length;
  const approvedAmount = items.filter((item) => item.status === 'approved').reduce((sum, item) => sum + item.amount, 0);
  const pendingAmount = items.filter((item) => item.status === 'pending' || item.status === 'eligible').reduce((sum, item) => sum + item.amount, 0);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralUrl);
      setMessage('Referral link copied. Share it with friends!');
    } catch {
      setMessage(referralUrl);
    }
  };

  const shareWhatsApp = () => window.open(`https://wa.me/?text=${encodeURIComponent('Join EarnBD using my referral link: ' + referralUrl)}`, '_blank', 'noopener,noreferrer');
  const shareTelegram = () => window.open(`https://t.me/share/url?url=${encodeURIComponent(referralUrl)}&text=${encodeURIComponent('Join EarnBD using my referral link')}`, '_blank', 'noopener,noreferrer');

  const statusClass = (status: ReferralStatus) => ({
    pending: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
    eligible: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
    approved: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
    rejected: 'bg-red-500/10 text-red-300 border-red-500/20'
  }[status]);

  return (
    <section className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-300">
          <Gift className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white">Refer & Earn</h2>
          <p className="text-sm text-slate-400">Earn a BDT 100 referral bonus after the 30-day eligibility period and review.</p>
        </div>
      </div>

      <div className="bg-gradient-to-br from-[#10231f] via-[#0f172a] to-[#0c1222] border border-emerald-500/20 rounded-3xl p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-emerald-300 font-bold mb-1">Your referral reward</p>
            <p className="text-3xl font-black text-white">৳100 <span className="text-sm font-semibold text-slate-400">per eligible signup</span></p>
            <p className="text-xs text-slate-400 mt-2">Bonus stays pending for 30 days. It is not withdrawable until approved.</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={copyLink} className="px-3 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold flex items-center gap-2"><Copy className="w-4 h-4" /> Copy link</button>
            <button onClick={shareWhatsApp} className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold">WhatsApp</button>
            <button onClick={shareTelegram} className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold">Telegram</button>
          </div>
        </div>
        <div className="mt-4 p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center gap-2">
          <span className="text-xs text-slate-300 break-all flex-1">{referralUrl}</span>
          <button onClick={copyLink} aria-label="Copy referral link" className="text-emerald-300 hover:text-emerald-200"><Copy className="w-4 h-4" /></button>
        </div>
        {message && <p className="text-xs text-emerald-300 mt-3 break-words">{message}</p>}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4"><Users className="w-4 h-4 text-cyan-300 mb-2" /><p className="text-xs text-slate-400">Successful referrals</p><p className="text-2xl font-black text-white">{items.length}</p></div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4"><Clock3 className="w-4 h-4 text-amber-300 mb-2" /><p className="text-xs text-slate-400">Pending / Eligible</p><p className="text-2xl font-black text-amber-300">{pending + eligible}</p><p className="text-xs text-slate-500 mt-1">{formatBDT(pendingAmount)} not yet approved</p></div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4"><CheckCircle2 className="w-4 h-4 text-emerald-300 mb-2" /><p className="text-xs text-slate-400">Approved bonus</p><p className="text-2xl font-black text-emerald-300">{formatBDT(approvedAmount)}</p></div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4"><Gift className="w-4 h-4 text-violet-300 mb-2" /><p className="text-xs text-slate-400">Per referral</p><p className="text-2xl font-black text-white">৳100</p><p className="text-xs text-slate-500 mt-1">30 days + review</p></div>
      </div>

      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden">
        <div className="p-5 border-b border-slate-800"><h3 className="font-bold text-white">Referral history</h3><p className="text-xs text-slate-400 mt-1">New members' email addresses are not displayed here to protect privacy.</p></div>
        {loading ? <div className="p-8 text-center text-sm text-slate-400">Loading referrals…</div> : items.length === 0 ? <div className="p-8 text-center text-sm text-slate-400">No referrals yet. Share your link to invite your first member.</div> : (
          <div className="divide-y divide-slate-800">
            {items.map((item) => {
              const created = asDate(item.createdAt);
              const eligibleAt = asDate(item.eligibleAt);
              return <div key={item.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div><p className="text-sm font-bold text-white">Referral · {item.id.slice(0, 8)}…</p><p className="text-xs text-slate-400 mt-1">Registered: {created?.toLocaleDateString() || '—'} · Eligible: {eligibleAt?.toLocaleDateString() || '—'}</p>{item.rejectionReason && <p className="text-xs text-red-300 mt-1">Reason: {item.rejectionReason}</p>}</div>
                <div className="flex items-center gap-3"><span className={`px-2.5 py-1 rounded-full border text-xs font-bold capitalize ${statusClass(item.status)}`}>{item.status}</span><span className="text-sm font-extrabold text-white">{formatBDT(item.amount)}</span></div>
              </div>;
            })}
          </div>
        )}
      </div>
      <p className="text-xs text-slate-500 flex items-start gap-2"><ExternalLink className="w-3.5 h-3.5 shrink-0 mt-0.5" /> Referral bonuses are subject to eligibility checks and approval. Approved bonuses count toward the existing ৳5,000 minimum withdrawal threshold.</p>
    </section>
  );
};
