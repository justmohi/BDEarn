import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Search, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  Wallet, 
  Layers, 
  Compass,
  FileText,
  Lock,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { AdCard, AdCategory } from '../types';
import { fetchAllAdCards } from '../services/adService';
import { AdCardItem } from '../components/AdCardItem';
import { WebsiteAdSlot } from '../components/WebsiteAdSlot';

const CATEGORIES: ('All' | AdCategory)[] = [
  'All',
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

interface HomePageProps {
  onOpenAuth: () => void;
  onNavigateTab: (tab: string) => void;
  onOpenWithdraw: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onOpenAuth,
  onNavigateTab,
  onOpenWithdraw,
}) => {
  const { currentUser, wallet, t } = useAuth();
  const [cards, setCards] = useState<AdCard[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = async () => {
    setLoading(true);
    try {
      const data = await fetchAllAdCards();
      setCards(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredCards = cards.filter(card => {
    if (!card.isActive) return false;
    const matchesCategory = selectedCategory === 'All' || card.category === selectedCategory;
    const matchesQuery = 
      card.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (card.titleBn && card.titleBn.toLowerCase().includes(searchQuery.toLowerCase())) ||
      card.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="space-y-12">
      
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-8 pb-12 sm:pt-14 sm:pb-16 bg-gradient-to-b from-[#0d142b] via-[#090d1a] to-[#090d1a] rounded-3xl border border-slate-800/80 shadow-2xl">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-6">
          
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider shadow-sm">
            <ShieldCheck className="w-4 h-4" />
            <span>Official Bangladesh Earning Directory</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
            Transparent Publisher <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              Revenue Sharing in BDT (৳)
            </span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-lg max-w-2xl mx-auto leading-relaxed">
            {t('heroSubtitle')}
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                const el = document.getElementById('directory-section');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow-xl shadow-emerald-500/25 flex items-center gap-2 transition active:scale-95"
            >
              <span>{t('startBrowsing')}</span>
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                if (!currentUser) onOpenAuth();
                else onNavigateTab('dashboard');
              }}
              className="px-6 py-3 rounded-xl bg-slate-800/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 font-bold text-sm flex items-center gap-2 transition"
            >
              <Wallet className="w-4 h-4 text-emerald-400" />
              <span>{t('viewDashboard')}</span>
            </button>
          </div>

          {/* Value Props Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 max-w-3xl mx-auto text-left">
            <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-2xl">
              <div className="text-[11px] text-slate-400 font-medium">Min Threshold</div>
              <div className="text-base sm:text-lg font-black text-white">৳3,000 BDT</div>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-2xl">
              <div className="text-[11px] text-slate-400 font-medium">Payment Wallets</div>
              <div className="text-base sm:text-lg font-black text-pink-400">bKash & Nagad</div>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-2xl">
              <div className="text-[11px] text-slate-400 font-medium">Carryover</div>
              <div className="text-base sm:text-lg font-black text-emerald-400">100% Rollover</div>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-2xl">
              <div className="text-[11px] text-slate-400 font-medium">Ad Networks</div>
              <div className="text-base sm:text-lg font-black text-cyan-400">Ad Network Compliant</div>
            </div>
          </div>

        </div>
      </section>

      {/* Official Telegram Channel */}
      <section className="relative overflow-hidden rounded-2xl border border-sky-500/30 bg-gradient-to-r from-sky-950/80 via-slate-900 to-blue-950/70 p-5 sm:p-6 shadow-lg">
        <div className="absolute -right-8 -top-10 h-36 w-36 rounded-full bg-sky-500/10 blur-2xl pointer-events-none" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-sky-400/30 bg-sky-500/15 text-sky-300">
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6" aria-hidden="true">
                <path d="M21.7 4.4 18.5 20c-.2 1.1-.8 1.4-1.7.9l-4.8-3.5-2.3 2.2c-.3.3-.5.5-1 .5l.4-4.9 8.9-8c.4-.4-.1-.6-.6-.2L6.4 14l-4.7-1.5c-1-.3-1-1 .2-1.5L20 3.9c.8-.3 1.9.2 1.7.5Z" />
              </svg>
            </div>
            <div>
              <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.16em] text-sky-300">Official Telegram Channel</div>
              <h3 className="text-lg sm:text-xl font-extrabold text-white">Join EarnBD on Telegram</h3>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-300">
                Follow our official channel for announcements, platform updates, and important notices.
              </p>
              <p className="mt-2 text-xs font-medium text-sky-200/80">@EarnBDviewad</p>
            </div>
          </div>
          <a
            href="https://t.me/EarnBDviewad"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-sky-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-sky-500/20 transition hover:bg-sky-400 active:scale-[0.98]"
          >
            Join Official Channel
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </section>

      {/* Manual sponsored-task reward notice */}
      <section className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/80 via-slate-900 to-teal-950/70 p-5 sm:p-6 shadow-lg">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-400/30 bg-emerald-500/15 text-emerald-300">
              <Gift className="h-6 w-6" />
            </div>
            <div>
              <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-300">EarnBD Sponsored Task Reward</div>
              <h3 className="text-lg sm:text-xl font-extrabold text-white">১০০টি বিজ্ঞাপন দেখুন, ৳৫০ রিওয়ার্ড পান</h3>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-300">
                ১০০টি আলাদা EarnBD স্পনসরড বিজ্ঞাপন/টাস্ক সম্পন্ন করার পর যাচাইয়ের জন্য অপেক্ষা করুন। যাচাই করে অ্যাডমিন অনুমোদন দিলে আপনার অ্যাকাউন্টে ৳৫০ ব্যালেন্স যোগ করা হবে। একই টাস্ক বারবার গণনা করা হবে না।
              </p>
              <p className="mt-2 text-xs font-medium text-emerald-200/80">Reward is added manually by the EarnBD admin after verification.</p>
            </div>
          </div>
          <button
            onClick={() => {
              if (!currentUser) onOpenAuth();
              else onNavigateTab('dashboard');
            }}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400 active:scale-[0.98]"
          >
            View Account <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      {/* 2. STRICT AD POLICY COMPLIANCE BANNER */}
      <section className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 justify-between">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>{t('policyNoticeTitle')}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  Zero PTC / Bot Ban
                </span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed max-w-4xl">
                {t('policyNoticeText')}
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('dashboard')}
            className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 shrink-0 self-end md:self-center"
          >
            <span>Learn More</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Website AdSense placement; enabled only after AdSense IDs are configured. */}
      <WebsiteAdSlot />

      {/* 3. DIRECTORY & IMAGE CARDS GRID */}
      <section id="directory-section" className="space-y-6">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1">
              Verified Advertising Directory
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              {t('directoryTitle')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              {t('directorySubtitle')}
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl pl-9 pr-3.5 py-2 text-sm text-white placeholder:text-slate-500 outline-none"
            />
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                  : 'bg-slate-900/90 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700'
              }`}
            >
              {cat === 'All' ? t('allCategories') : cat}
            </button>
          ))}
        </div>

        {/* Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-slate-900/60 rounded-2xl h-80 animate-pulse border border-slate-800" />
            ))}
          </div>
        ) : filteredCards.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCards.map((card) => (
              <AdCardItem key={card.id} card={card} />
            ))}
          </div>
        ) : (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-10 text-center">
            <Layers className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h4 className="text-base font-bold text-white mb-1">No Offers Found</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
              No advertising listings match the selected category or search keyword.
            </p>
            <button
              onClick={() => { setSelectedCategory('All'); setSearchQuery(''); }}
              className="text-xs font-bold text-emerald-400 hover:underline"
            >
              Reset Category Filters
            </button>
          </div>
        )}

      </section>

      {/* 4. HOW EARNBD WORKS SECTION */}
      <section className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-10">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            How EarnBD Operates for BD Publishers
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2">
            A fully transparent, compliant financial workflow with zero paid-to-click gimmicks.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="bg-slate-950/60 border border-slate-800/80 p-5 rounded-2xl relative">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-sm mb-3">
              1
            </div>
            <h3 className="text-base font-bold text-white mb-2">
              Clean Content & Directory
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Publishers drive legitimate user interest through curated, categorized sponsorship offers and verified digital services across Bangladesh.
            </p>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 p-5 rounded-2xl relative">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-black text-sm mb-3">
              2
            </div>
            <h3 className="text-base font-bold text-white mb-2">
              Verified Revenue Share
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              At the close of each cycle, verified net advertising receipts are allocated to publishers according to approved commission percentages.
            </p>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 p-5 rounded-2xl relative">
            <div className="w-8 h-8 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center font-black text-sm mb-3">
              3
            </div>
            <h3 className="text-base font-bold text-white mb-2">
              ৳5,000 bKash / Nagad Payout
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Once approved available earnings reach ৳5,000 BDT, request manual disbursement. Admin securely sends funds and logs the TrxID.
            </p>
          </div>

        </div>
      </section>

    </div>
  );
};
