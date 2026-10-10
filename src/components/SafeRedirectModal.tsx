import React from 'react';
import { ExternalLink, ShieldAlert, CheckCircle, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { isValidExternalUrl } from '../utils/security';

interface SafeRedirectModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUrl: string;
  sponsorTitle: string;
}

export const SafeRedirectModal: React.FC<SafeRedirectModalProps> = ({
  isOpen,
  onClose,
  targetUrl,
  sponsorTitle,
}) => {
  const { t } = useAuth();

  if (!isOpen) return null;

  const isValid = isValidExternalUrl(targetUrl);

  const handleProceed = () => {
    if (isValid) {
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#0f172a] border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
          <ExternalLink className="w-6 h-6" />
        </div>

        <h3 className="text-lg font-bold text-white mb-2">
          {t('redirectModalTitle')}
        </h3>

        <p className="text-sm text-slate-300 mb-4">
          {t('redirectModalWarning')}
        </p>

        {/* Sponsor details */}
        <div className="bg-slate-900/80 rounded-xl p-3.5 border border-slate-800 mb-5">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Destination Sponsor
          </div>
          <div className="text-sm font-bold text-white mb-1.5">{sponsorTitle}</div>
          <div className="text-xs text-emerald-400 font-mono break-all bg-slate-950 p-2 rounded border border-slate-800/80">
            {targetUrl}
          </div>
        </div>

        {/* Compliance note */}
        <div className="flex items-start gap-2 text-[11px] text-slate-400 bg-emerald-950/20 border border-emerald-800/30 rounded-lg p-2.5 mb-5">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>
            Non-incentivized visit. Browsing sponsor websites does not generate click rewards or fake impressions.
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
          >
            {t('cancel')}
          </button>
          
          <button
            onClick={handleProceed}
            disabled={!isValid}
            className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-1.5 transition ${
              isValid
                ? 'bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/20'
                : 'bg-slate-700 text-slate-400 cursor-not-allowed'
            }`}
          >
            <span>{t('proceedToWebsite')}</span>
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
