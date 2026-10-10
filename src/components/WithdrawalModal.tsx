import React, { useState } from 'react';
import { 
  X, 
  ArrowRight, 
  ShieldAlert, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { WalletType } from '../types';
import { submitWithdrawalRequest, MIN_WITHDRAWAL_BDT } from '../services/walletService';
import { formatBDT, isValidBdMobileNumber } from '../utils/security';

interface WithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const WithdrawalModal: React.FC<WithdrawalModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { currentUser, wallet, refreshWallet, t } = useAuth();

  const [step, setStep] = useState<'form' | 'review' | 'success'>('form');
  const [walletType, setWalletType] = useState<WalletType>('bKash');
  const [walletNumber, setWalletNumber] = useState('');
  const [amount, setAmount] = useState<number>(3000);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [submittedRequestId, setSubmittedRequestId] = useState('');

  if (!isOpen) return null;

  const availableBalance = wallet?.availableBalance || 0;
  const isEligible = availableBalance >= MIN_WITHDRAWAL_BDT;

  const handleReviewStep = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!isEligible) {
      setErrorMessage(t('insufficientBalance'));
      return;
    }

    if (!isValidBdMobileNumber(walletNumber)) {
      setErrorMessage(t('invalidPhone'));
      return;
    }

    if (amount < MIN_WITHDRAWAL_BDT || amount > availableBalance) {
      setErrorMessage(t('invalidAmount'));
      return;
    }

    setStep('review');
  };

  const handleConfirmSubmit = async () => {
    if (!currentUser) return;
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

      setSubmittedRequestId(res.requestId);
      await refreshWallet();
      setStep('success');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit withdrawal request');
      setStep('form');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setStep('form');
    setWalletNumber('');
    setAmount(Math.max(3000, Math.min(3000, availableBalance)));
    setErrorMessage('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#0f172a] border border-slate-700 w-full max-w-lg rounded-2xl p-5 sm:p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto">
        <button
          onClick={resetForm}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        {/* STEP 1: FORM INPUT */}
        {step === 'form' && (
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-9 h-9 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-400 flex items-center justify-center font-bold">
                ৳
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-white">
                  {t('withdrawTitle')}
                </h3>
                <p className="text-xs text-slate-400">{t('withdrawSubtitle')}</p>
              </div>
            </div>

            {/* Balances Badge */}
            <div className="my-4 p-3.5 bg-slate-900/90 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 block font-medium">Withdrawable Balance</span>
                <span className={`text-lg font-extrabold ${isEligible ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {formatBDT(availableBalance)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-400 block font-medium">Requirement</span>
                <span className="text-xs font-bold text-slate-300">Min ৳5,000 BDT</span>
              </div>
            </div>

            {!isEligible && (
              <div className="mb-4 p-3 bg-amber-950/30 border border-amber-800/40 rounded-xl flex items-start gap-2.5 text-xs text-amber-200">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">{t('insufficientBalance')}</p>
                  <p className="text-[11px] text-amber-300/80 mt-0.5">
                    {t('needMoreToWithdraw', { remaining: 3000 - availableBalance })}
                  </p>
                </div>
              </div>
            )}

            {errorMessage && (
              <div className="mb-4 p-3 bg-red-950/30 border border-red-800/40 rounded-xl flex items-center gap-2 text-xs text-red-200">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleReviewStep} className="space-y-4">
              
              {/* Select Wallet Provider */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-2">
                  {t('selectMethod')}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  
                  {/* bKash */}
                  <button
                    type="button"
                    onClick={() => setWalletType('bKash')}
                    className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${
                      walletType === 'bKash'
                        ? 'bg-pink-950/40 border-pink-500 text-white shadow-lg shadow-pink-950/30'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#e2136e] flex items-center justify-center font-black text-white text-xs">
                      bK
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-bold">bKash</div>
                      <div className="text-[10px] text-slate-400">Personal Wallet</div>
                    </div>
                  </button>

                  {/* Nagad */}
                  <button
                    type="button"
                    onClick={() => setWalletType('Nagad')}
                    className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${
                      walletType === 'Nagad'
                        ? 'bg-orange-950/40 border-orange-500 text-white shadow-lg shadow-orange-950/30'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#f7931e] flex items-center justify-center font-black text-white text-xs">
                      নগদ
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-bold">Nagad</div>
                      <div className="text-[10px] text-slate-400">Personal Wallet</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Wallet Number */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1.5">
                  {t('walletNumber')}
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={walletNumber}
                    onChange={(e) => setWalletNumber(e.target.value)}
                    placeholder="017XXXXXXXX"
                    maxLength={11}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-white font-mono text-sm placeholder:text-slate-600 outline-none"
                    required
                  />
                  <div className="absolute right-3 top-2.5 text-xs text-slate-500 font-mono">
                    BD 11-digit
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  {t('walletNumberHelp')}
                </p>
              </div>

              {/* Amount Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    {t('amountToWithdraw')}
                  </label>
                  <button
                    type="button"
                    onClick={() => setAmount(availableBalance)}
                    className="text-xs text-emerald-400 hover:underline font-semibold"
                  >
                    {t('maxWithdrawable')} ({formatBDT(availableBalance)})
                  </button>
                </div>

                <div className="relative">
                  <div className="absolute left-3.5 top-2.5 text-slate-400 font-bold">৳</div>
                  <input
                    type="number"
                    min={3000}
                    max={availableBalance || 3000}
                    step={100}
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl pl-8 pr-3.5 py-2.5 text-white font-bold text-base outline-none"
                    required
                  />
                </div>

                {/* Fast Presets */}
                <div className="flex gap-2 mt-2">
                  {[3000, 5000, 10000, 15000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAmount(preset)}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition ${
                        amount === preset
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      ৳{preset.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Security PIN Warning */}
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80 flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-amber-300">{t('pinWarningTitle')}</div>
                  <div className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                    {t('pinWarningText')}
                  </div>
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={!isEligible || availableBalance < 3000}
                className={`w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition ${
                  isEligible
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 active:scale-[0.98]'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                }`}
              >
                <span>Continue to Review</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* STEP 2: REVIEW & CONFIRM */}
        {step === 'review' && (
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                ✓
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  {t('confirmWithdrawalTitle')}
                </h3>
                <p className="text-xs text-slate-400">{t('confirmSummary')}</p>
              </div>
            </div>

            <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 my-4 space-y-3">
              <div className="flex justify-between items-center text-sm border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">Payment Wallet</span>
                <span className="font-bold text-white flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${walletType === 'bKash' ? 'bg-[#e2136e]' : 'bg-[#f7931e]'}`} />
                  {walletType}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">Target Mobile Number</span>
                <span className="font-mono font-bold text-emerald-400">{walletNumber}</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">Withdrawal Amount</span>
                <span className="font-bold text-white">{formatBDT(amount)}</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">Service / Cashout Fee</span>
                <span className="font-bold text-emerald-400">৳0 (Free)</span>
              </div>
              <div className="flex justify-between items-center text-base pt-1 font-bold">
                <span className="text-slate-200">You Will Receive</span>
                <span className="text-emerald-400 text-lg">{formatBDT(amount)}</span>
              </div>
            </div>

            <div className="text-xs text-slate-400 bg-slate-950/60 p-3 rounded-xl border border-slate-800/60 mb-5 flex items-start gap-2">
              <Clock className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <span>
                Funds will be reserved from your available balance immediately upon submission. Admin manually transfers via {walletType} and provides TrxID.
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStep('form')}
                disabled={isSubmitting}
                className="flex-1 py-2.5 px-4 rounded-xl font-semibold text-sm bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                disabled={isSubmitting}
                className="flex-1 py-2.5 px-4 rounded-xl font-bold text-sm bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <span>{t('submitting')}</span>
                ) : (
                  <>
                    <span>{t('confirmAndSubmit')}</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: SUCCESS CONFIRMATION */}
        {step === 'success' && (
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h3 className="text-xl font-bold text-white mb-2">
              Request Submitted!
            </h3>
            <p className="text-sm text-slate-300 mb-5 max-w-sm mx-auto">
              {t('requestSuccess')}
            </p>

            <div className="bg-slate-900 rounded-xl p-3 border border-slate-800 text-xs text-slate-400 mb-6 font-mono">
              Request ID: <span className="text-emerald-400 font-bold">{submittedRequestId}</span>
            </div>

            <button
              type="button"
              onClick={resetForm}
              className="w-full py-2.5 px-4 rounded-xl font-bold text-sm bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
            >
              Done & Return to Dashboard
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
