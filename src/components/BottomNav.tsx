import React from 'react';
import { 
  Compass, 
  Sparkles, 
  LayoutDashboard, 
  ArrowDownCircle, 
  Lock, 
  UserCheck 
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface BottomNavProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenAuth: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  setCurrentTab,
  onOpenAuth,
}) => {
  const { currentUser, isAdmin, t } = useAuth();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#090d1a]/95 backdrop-blur-lg border-t border-slate-800 px-2 py-1.5 safe-area-bottom">
      <div className="flex items-center justify-around max-w-md mx-auto">
        
        {/* Home */}
        <button
          onClick={() => setCurrentTab('home')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg transition-colors ${
            currentTab === 'home' 
              ? 'text-emerald-400 font-bold' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Compass className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">{t('home')}</span>
        </button>

        {/* Directory */}
        <button
          onClick={() => setCurrentTab('directory')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg transition-colors ${
            currentTab === 'directory' 
              ? 'text-emerald-400 font-bold' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">{t('directory')}</span>
        </button>

        {/* Dashboard */}
        <button
          onClick={() => {
            if (!currentUser) onOpenAuth();
            else setCurrentTab('dashboard');
          }}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg transition-colors ${
            currentTab === 'dashboard' 
              ? 'text-emerald-400 font-bold' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">{t('dashboard')}</span>
        </button>

        {/* Withdraw */}
        <button
          onClick={() => {
            if (!currentUser) onOpenAuth();
            else setCurrentTab('withdraw');
          }}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg transition-colors ${
            currentTab === 'withdraw' 
              ? 'text-pink-400 font-bold' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ArrowDownCircle className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">{t('withdraw')}</span>
        </button>

        {/* Admin or Profile */}
        {isAdmin ? (
          <button
            onClick={() => setCurrentTab('admin')}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg transition-colors ${
              currentTab === 'admin' 
                ? 'text-amber-400 font-bold' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lock className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">{t('admin')}</span>
          </button>
        ) : (
          <button
            onClick={() => {
              if (!currentUser) onOpenAuth();
              else setCurrentTab('dashboard');
            }}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg transition-colors ${
              currentTab === 'profile' 
                ? 'text-emerald-400 font-bold' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserCheck className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">{currentUser ? t('profile') : t('login')}</span>
          </button>
        )}

      </div>
    </nav>
  );
};
