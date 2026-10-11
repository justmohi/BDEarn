import React, { useState } from 'react';
import { 
  ArrowDownCircle, 
  ShieldAlert, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  Clock, 
  ArrowRight,
  Wallet
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { WalletType } from '../types';
import { submitWithdrawalRequest, MIN_WITHDRAWAL_BDT } from '../services/walletService';
import { formatBDT, isValidBdMobileNumber } from '../utils/security';

interface WithdrawPageProps {
  onOpenAuth: () => void;
  onNavigateTab: (tab: string) => void;
}

export const WithdrawPage: React.FC<WithdrawPageProps> = ({
  onOpenAuth,
  onNavigateTab,
}) => {
  const { currentUser, wallet, refreshWallet, t } = useAuth();

  const [walletType, setWalletType] = useState<WalletType>('bKash');
  const [walletNumber, setWalletNumber] = useState('');
  const [amount, setAmount] = useState<number>(3000);
  const [step, setStep] = useState<'form' | 'review' | 'success'>('form');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [submittedId, setSubmittedId] = useState('');

  if (!currentUser) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-12 text-center max-w-xl mx-auto my-12">
        <div className="w-14 h-14 rounded-2xl bg-pink-500/10 text-pink-400 flex items-center justify-center mx-auto mb-4 border border-pink-500/20">
          <ArrowDownCircle className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">{t('withdrawTitle')}</h2>
        <p className="text-sm text-slate-300 mb-6">
          Sign in to your EarnBD publisher account to request bKash, Nagad, or Binance payouts.
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
  const isEligible = availableBalance >= MIN_WITHDRAWAL_BDT;

  const handleReview = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!isEligible) {
      setErrorMessage(t('insufficientBalance'));
      return;
    }
    if (walletType === 'Binance' ? !/^\d{6,20}$/.test(walletNumber.trim()) : !isValidBdMobileNumber(walletNumber)) {
      setErrorMessage(walletType === 'Binance' ? 'Enter a valid Binance UID (6–20 digits).' : t('invalidPhone'));
      return;
    }
    if (amount < MIN_WITHDRAWAL_BDT || amount > availableBalance) {
      setErrorMessage(t('invalidAmount'));
      return;
    }
    setStep('review');
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const res = await submitWithdrawalRequest({
        userId: currentUser.uid,
        userEmail: currentUser.email || '',
        walletType,
        walletNumber: walletNumber.trim(),
        amount: Number(amount)
      });
      setSubmittedId(res.requestId);
      await refreshWallet();
      setStep('success');
    } catch (err: any) {
      setErrorMessage(err.message || 'Submission failed');
      setStep('form');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      
      {/* Title & Banner */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold uppercase tracking-wider text-pink-400">
            Manual Payout Portal
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
            BDT ৳{MIN_WITHDRAWAL_BDT.toLocaleString()} Minimum
          </span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-white">
          {t('withdrawTitle')}
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 mt-1">
          {t('withdrawSubtitle')}
        </p>
      </div>

      {/* Available Balance Status Card */}
      <div className="bg-[#0f172a] border border-slate-700 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs text-slate-400 block font-medium">Withdrawable Balance</span>
          <div className="text-3xl font-black text-emerald-400 mt-0.5">
            {formatBDT(availableBalance)}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Requirement: Minimum {formatBDT(MIN_WITHDRAWAL_BDT)} threshold to withdraw.
          </div>
        </div>

        <div>
          {isEligible ? (
            <div className="flex items-center gap-2 px-3.5 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Eligible to Withdraw</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3.5 py-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <span>Minimum withdrawal: {formatBDT(MIN_WITHDRAWAL_BDT)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Request Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        
        {step === 'form' && (
          <form onSubmit={handleReview} className="space-y-6">
            
            {errorMessage && (
              <div className="p-3.5 bg-red-950/40 border border-red-800 rounded-xl text-xs text-red-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Wallet Selector */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-2.5">
                {t('selectMethod')}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={() => setWalletType('bKash')}
                  aria-pressed={walletType === 'bKash'}
                  className={`p-4 rounded-2xl border text-left transition-all flex items-center gap-3.5 ${
                    walletType === 'bKash'
                      ? 'bg-pink-950/40 border-pink-500 shadow-lg shadow-pink-950/30'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl bg-[#d12053] flex items-center justify-center shrink-0">
                    <svg viewBox="0 0 64 64" role="img" aria-label="bKash logo" className="w-9 h-9">
                      <path d="M13 8 43 13 28 32 49 53 36 56 8 28 26 28Z" fill="#fff"/>
                      <path d="M34 8 56 28 40 45 34 38 44 28 30 15Z" fill="#fff"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">bKash Payout</div>
                    <div className="text-xs text-slate-400">Personal Account (0% Fee)</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setWalletType('Nagad')}
                  aria-pressed={walletType === 'Nagad'}
                  className={`p-4 rounded-2xl border text-left transition-all flex items-center gap-3.5 ${
                    walletType === 'Nagad'
                      ? 'bg-orange-950/40 border-orange-500 shadow-lg shadow-orange-950/30'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 to-orange-500 flex items-center justify-center shrink-0">
                    <svg viewBox="0 0 64 64" role="img" aria-label="Nagad logo" className="w-10 h-10">
                      <circle cx="32" cy="32" r="25" fill="none" stroke="#fff" strokeWidth="7" strokeDasharray="120 38" transform="rotate(-38 32 32)"/>
                      <path d="M20 40 29 20 38 39 44 28" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">Nagad Payout</div>
                    <div className="text-xs text-slate-400">Personal Account (0% Fee)</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setWalletType('Binance')}
                  aria-pressed={walletType === 'Binance'}
                  className={`p-4 rounded-2xl border text-left transition-all flex items-center gap-3.5 ${
                    walletType === 'Binance'
                      ? 'bg-yellow-950/40 border-yellow-400 shadow-lg shadow-yellow-950/30'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl bg-black border border-slate-800 flex items-center justify-center shrink-0">
                    <svg viewBox="0 0 64 64" role="img" aria-label="Binance logo" className="w-10 h-10" fill="#F0B90B">
                      <path d="M32 4 45 17 36 26 32 22 28 26 19 17Z"/>
                      <path d="M17 19 26 28 22 32 26 36 17 45 4 32Z"/>
                      <path d="M47 19 60 32 47 45 38 36 42 32 38 28Z"/>
                      <path d="M32 42 36 38 45 47 32 60 19 47 28 38Z"/>
                      <path d="M32 27 37 32 32 37 27 32Z"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">Binance Payout</div>
                    <div className="text-xs text-slate-400">Binance UID (Manual)</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Mobile Number */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1.5">
                {walletType === 'Binance' ? 'Binance UID' : t('walletNumber')}
              </label>
              <div className="relative">
                <input
                  type={walletType === 'Binance' ? 'text' : 'tel'}
                  inputMode={walletType === 'Binance' ? 'numeric' : 'tel'}
                  value={walletNumber}
                  onChange={(e) => setWalletNumber(e.target.value.replace(walletType === 'Binance' ? /\D/g : /$^/, ''))}
                  placeholder={walletType === 'Binance' ? 'Enter Binance UID' : '017XXXXXXXX'}
                  maxLength={walletType === 'Binance' ? 20 : 11}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-3 text-white font-mono text-base placeholder:text-slate-600 outline-none"
                  required
                />
                <span className="absolute right-4 top-3.5 text-xs text-slate-500 font-mono">
                  {walletType === 'Binance' ? '6–20 digits' : '11 digits'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {walletType === 'Binance' ? 'Enter the numeric UID shown in your Binance profile. Never share your password, OTP, or API key.' : t('walletNumberHelp')}
              </p>
            </div>

            {/* Amount */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  {t('amountToWithdraw')}
                </label>
                <button
                  type="button"
                  onClick={() => setAmount(availableBalance)}
                  className="text-xs font-bold text-emerald-400 hover:underline"
                >
                  Max All ({formatBDT(availableBalance)})
                </button>
              </div>

              <div className="relative">
                <span className="absolute left-4 top-3 text-slate-400 font-bold text-lg">৳</span>
                <input
                  type="number"
                  min={MIN_WITHDRAWAL_BDT}
                  max={availableBalance || MIN_WITHDRAWAL_BDT}
                  step={100}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl pl-9 pr-4 py-3 text-white font-extrabold text-lg outline-none"
                  required
                />
              </div>

              <div className="flex gap-2 mt-2">
                {[3000, 6000, 10000, 15000].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAmount(val)}
                    className={`text-xs px-3 py-1 rounded-lg border transition ${
                      amount === val 
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300' 
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    ৳{val.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {/* Safety PIN Notice */}
            <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-amber-300">{t('pinWarningTitle')}</h4>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {t('pinWarningText')}
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!isEligible}
              className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition ${
                isEligible 
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-xl shadow-emerald-500/20 active:scale-[0.98]'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              <span>Review Withdrawal Details</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {step === 'review' && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-white">
              {t('confirmWithdrawalTitle')}
            </h3>

            <div className="bg-slate-950 rounded-2xl p-5 border border-slate-800 space-y-3.5">
              <div className="flex justify-between text-sm pb-2 border-b border-slate-800">
                <span className="text-slate-400">Mobile Wallet Provider</span>
                <span className="font-bold text-white flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${walletType === 'bKash' ? 'bg-[#e2136e]' : walletType === 'Nagad' ? 'bg-[#f7931e]' : 'bg-[#f0b90b]'}`} />
                  {walletType}
                </span>
              </div>
              <div className="flex justify-between text-sm pb-2 border-b border-slate-800">
                <span className="text-slate-400">{walletType === 'Binance' ? 'Binance UID' : 'Personal Mobile Number'}</span>
                <span className="font-mono font-bold text-emerald-400 text-base">{walletNumber}</span>
              </div>
              <div className="flex justify-between text-sm pb-2 border-b border-slate-800">
                <span className="text-slate-400">Withdrawal Amount</span>
                <span className="font-black text-white text-lg">{formatBDT(amount)}</span>
              </div>
              <div className="flex justify-between text-sm pb-2 border-b border-slate-800">
                <span className="text-slate-400">Processing Fee</span>
                <span className="font-bold text-emerald-400">৳0 (Free)</span>
              </div>
              <div className="flex justify-between text-base pt-1 font-bold">
                <span className="text-slate-200">You Receive</span>
                <span className="text-emerald-400 text-xl font-black">{formatBDT(amount)}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStep('form')}
                disabled={isSubmitting}
                className="flex-1 py-3 px-4 rounded-xl font-semibold text-sm bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                Back to Edit
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isSubmitting}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-sm bg-emerald-500 hover:bg-emerald-600 text-white shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <span>Submitting...</span>
                ) : (
                  <>
                    <span>Confirm & Lock Request</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h3 className="text-2xl font-bold text-white">
              Withdrawal Request Submitted!
            </h3>
            <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
              Your requested funds of <strong className="text-white">{formatBDT(amount)}</strong> have been safely reserved. The administrator will manually process the transaction via {walletType} to your account.
            </p>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs font-mono text-slate-400 max-w-sm mx-auto">
              Tracking ID: <span className="text-emerald-400 font-bold">{submittedId}</span>
            </div>
            <button
              onClick={() => onNavigateTab('dashboard')}
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/20"
            >
              View in Dashboard
            </button>
          </div>
        )}

      </div>

    </div>
  );
};
