import React from 'react';
import { ShieldCheck, Heart, ExternalLink } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface FooterProps {
  onNavigatePolicy: (section: 'privacy' | 'terms' | 'adPolicy' | 'contact') => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigatePolicy }) => {
  const { t } = useAuth();

  return (
    <footer className="bg-[#060a14] border-t border-slate-800/80 text-slate-400 text-xs py-10 pb-24 md:pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          {/* Brand & Mission */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-bold text-sm">
                ৳
              </div>
              <span className="text-lg font-black text-white">
                Earn<span className="text-emerald-400">BD</span>
              </span>
            </div>
            <p className="text-slate-400 text-xs max-w-md leading-relaxed mb-4">
              EarnBD is a modern digital advertising directory and publisher commission platform engineered for content creators and web publishers across Bangladesh. All earnings are denominated in BDT (৳) and paid via bKash and Nagad.
            </p>
            <div className="flex items-center gap-2 text-emerald-400 text-[11px] font-semibold bg-emerald-950/20 border border-emerald-800/30 w-fit px-3 py-1.5 rounded-lg">
              <ShieldCheck className="w-4 h-4" />
              <span>100% Policy-Compliant • No Paid-To-Click • Zero Fraud Guarantee</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-slate-200 font-bold uppercase tracking-wider text-xs mb-3">
              Compliance & Legal
            </h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => onNavigatePolicy('privacy')}
                  className="hover:text-emerald-400 transition"
                >
                  {t('privacy')}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigatePolicy('terms')}
                  className="hover:text-emerald-400 transition"
                >
                  {t('terms')}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigatePolicy('adPolicy')}
                  className="hover:text-emerald-400 transition text-emerald-400 font-medium"
                >
                  {t('adPolicy')} & Non-Incentivized Guidelines
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigatePolicy('contact')}
                  className="hover:text-emerald-400 transition"
                >
                  {t('contact')}
                </button>
              </li>
            </ul>
          </div>

          {/* Payout & Banking Info */}
          <div>
            <h4 className="text-slate-200 font-bold uppercase tracking-wider text-xs mb-3">
              Manual Payouts (BD)
            </h4>
            <p className="text-[11px] leading-relaxed mb-3 text-slate-400">
              Manual payouts dispatched via official Bangladeshi mobile wallets upon reaching the minimum ৳5,000 threshold.
            </p>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-pink-950/50 border border-pink-500/30 text-pink-300 font-bold rounded text-[11px]">
                bKash
              </span>
              <span className="px-2.5 py-1 bg-orange-950/50 border border-orange-500/30 text-orange-300 font-bold rounded text-[11px]">
                Nagad
              </span>
              <span className="px-2.5 py-1 bg-slate-800 border border-slate-700 text-slate-300 font-bold rounded text-[11px]">
                ৳5,000 Min
              </span>
            </div>
          </div>

        </div>

        <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-500 text-[11px]">
          <div>
            © {new Date().getFullYear()} EarnBD. Designed for Bangladesh publishers. All rights reserved.
          </div>
          <div className="flex items-center gap-1 text-slate-400">
            <span>Built with precision for Bangladeshi web publishers</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
