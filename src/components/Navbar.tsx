import React from 'react';
import { 
  Wallet, 
  ShieldCheck, 
  Globe, 
  User, 
  LogOut, 
  LayoutDashboard, 
  Compass, 
  ArrowDownCircle, 
  Lock,
  Sparkles
} from 'lucide-react';
import { useAuth, ADMIN_BOOTSTRAP_EMAIL } from '../contexts/AuthContext';
import { formatBDT } from '../utils/security';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenAuth: () => void;
  onOpenWithdraw: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  onOpenAuth,
  onOpenWithdraw,
}) => {
  const { currentUser, userProfile, wallet, isAdmin, language, setLanguage, logoutUser, t } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-[#090d1a] border-b border-slate-800/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo & Brand */}
          <div 
            onClick={() => setCurrentTab('home')}
            className="flex items-center gap-3 cursor-pointer select-none group"
          >
            <img src="/earnbd-logo.svg" alt="EarnBD logo" className="w-10 h-10 object-contain drop-shadow-lg group-hover:scale-105 transition-transform" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  Earn<span className="text-emerald-400">BD</span>
                </span>
                <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Verified
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block font-medium">
                {t('tagline')}
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            <button
              onClick={() => setCurrentTab('home')}
              className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                currentTab === 'home'
                  ? 'text-white bg-slate-800/80 border border-slate-700/60'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <Compass className="w-4 h-4 text-emerald-400" />
              {t('home')}
            </button>

            <button
              onClick={() => setCurrentTab('directory')}
              className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                currentTab === 'directory'
                  ? 'text-white bg-slate-800/80 border border-slate-700/60'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              {t('directory')}
            </button>

            <button
              onClick={() => {
                if (!currentUser) onOpenAuth();
                else setCurrentTab('dashboard');
              }}
              className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                currentTab === 'dashboard'
                  ? 'text-white bg-slate-800/80 border border-slate-700/60'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-cyan-400" />
              {t('dashboard')}
            </button>

            <button
              onClick={() => {
                if (!currentUser) onOpenAuth();
                else setCurrentTab('withdraw');
              }}
              className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                currentTab === 'withdraw'
                  ? 'text-white bg-slate-800/80 border border-slate-700/60'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <ArrowDownCircle className="w-4 h-4 text-pink-400" />
              {t('withdraw')}
            </button>

            {isAdmin && (
              <button
                onClick={() => setCurrentTab('admin')}
                className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                  currentTab === 'admin'
                    ? 'text-amber-300 bg-amber-950/40 border border-amber-500/40'
                    : 'text-amber-400 hover:bg-amber-950/30'
                }`}
              >
                <Lock className="w-4 h-4 text-amber-400" />
                {t('admin')}
              </button>
            )}
          </nav>

          {/* Right actions: Balance badge, Language toggle, Auth */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* User Withdrawable Balance pill if logged in */}
            {currentUser && wallet && (
              <div 
                onClick={() => setCurrentTab('dashboard')}
                className="cursor-pointer hidden sm:flex items-center gap-2 bg-slate-800/90 hover:bg-slate-800 border border-emerald-500/30 px-3 py-1.5 rounded-xl transition-all"
                title="Withdrawable Balance"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block leading-none font-medium">Balance</span>
                  <span className="text-xs sm:text-sm font-bold text-emerald-400">
                    {formatBDT(wallet.availableBalance)}
                  </span>
                </div>
              </div>
            )}

            {/* Language Switcher */}
            <div className="flex items-center bg-slate-800/60 p-1 rounded-lg border border-slate-700/50">
              <button
                onClick={() => setLanguage('en')}
                className={`px-2 py-1 text-xs font-bold rounded transition-colors ${
                  language === 'en' 
                    ? 'bg-emerald-500 text-white' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('bn')}
                className={`px-2 py-1 text-xs font-bold rounded transition-colors ${
                  language === 'bn' 
                    ? 'bg-emerald-500 text-white' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                বাংলা
              </button>
            </div>

            {/* Authentication Button / User Profile */}
            {currentUser ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentTab('dashboard')}
                  className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition"
                >
                  <div className="w-6 h-6 rounded-full bg-emerald-600/30 text-emerald-300 flex items-center justify-center font-bold text-xs uppercase">
                    {userProfile?.displayName ? userProfile.displayName.charAt(0) : 'U'}
                  </div>
                  <span className="max-w-[100px] truncate hidden md:inline">
                    {userProfile?.displayName || currentUser.email?.split('@')[0]}
                  </span>
                </button>
                <button
                  onClick={logoutUser}
                  title="Logout"
                  className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-slate-800 transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm px-4 py-2 rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
              >
                {t('login')}
              </button>
            )}

          </div>
        </div>
      </div>
    </header>
  );
};
