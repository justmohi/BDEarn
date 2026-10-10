import React, { useState } from 'react';
import { ShieldCheck, FileText, HelpCircle, Mail, MessageSquare } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface PolicyPageProps {
  initialSection?: 'privacy' | 'terms' | 'adPolicy' | 'contact';
}

export const PolicyPage: React.FC<PolicyPageProps> = ({ initialSection = 'adPolicy' }) => {
  const [section, setSection] = useState<'privacy' | 'terms' | 'adPolicy' | 'contact'>(initialSection);
  const { t } = useAuth();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      
      {/* Navigation tabs for policy */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
        <button
          onClick={() => setSection('adPolicy')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 whitespace-nowrap ${
            section === 'adPolicy'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Ad Policy & Compliance</span>
        </button>

        <button
          onClick={() => setSection('terms')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 whitespace-nowrap ${
            section === 'terms'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4 text-cyan-400" />
          <span>Terms of Service</span>
        </button>

        <button
          onClick={() => setSection('privacy')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 whitespace-nowrap ${
            section === 'privacy'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-pink-400" />
          <span>Privacy Policy</span>
        </button>

        <button
          onClick={() => setSection('contact')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 whitespace-nowrap ${
            section === 'contact'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Mail className="w-4 h-4 text-amber-400" />
          <span>Contact & Support</span>
        </button>
      </div>

      {/* 1. AD POLICY & NON-INCENTIVIZED AD NETWORK COMPLIANCE */}
      {section === 'adPolicy' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 text-sm text-slate-300 leading-relaxed">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
              ✓
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">EarnBD Advertising & Anti-Fraud Policy</h2>
              <p className="text-xs text-slate-400">Strict adherence to advertising networks and global ad network standards.</p>
            </div>
          </div>

          <div className="p-4 bg-emerald-950/30 border border-emerald-800/40 rounded-2xl text-xs text-emerald-200">
            <strong>Critical Policy Mandate:</strong> EarnBD strictly prohibits all forms of Paid-to-Click (PTC), Paid-to-View (PTV), automated bot clicks, proxy spoofing, or forced ad viewing. Visiting cards in the directory does NOT reward users directly per click.
          </div>

          <div>
            <h3 className="text-base font-bold text-white mb-2">1. No Direct Click Incentive</h3>
            <p>
              Under our integration terms with advertising networks including advertising networks, publishers must not encourage, solicit, or incentivize visitors to click on advertisements or sponsored links. Clicking an ad card does not increase your personal wallet balance.
            </p>
          </div>

          <div>
            <h3 className="text-base font-bold text-white mb-2">2. Genuine Revenue Distribution Model</h3>
            <p>
              Commissions distributed through EarnBD are solely derived from legitimate, verified monthly net receipts audited and confirmed by the administration. Any unverified impressions or simulated traffic are systematically stripped from revenue pools.
            </p>
          </div>

          <div>
            <h3 className="text-base font-bold text-white mb-2">3. Zero-Tolerance Fraud Prevention</h3>
            <p>
              Users detected utilizing VPNs, automated browsing scripts, click farms, or repeated artificial requests are subject to immediate account suspension and forfeiture of any pending balances under Section 7 of our publisher contract.
            </p>
          </div>
        </div>
      )}

      {/* 2. TERMS OF SERVICE */}
      {section === 'terms' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 text-sm text-slate-300 leading-relaxed">
          <h2 className="text-xl font-bold text-white">Terms of Service for EarnBD</h2>
          <p className="text-xs text-slate-400">Last updated: October 2026 • Governed by Bangladesh Digital Commerce Guidelines</p>

          <div>
            <h3 className="text-base font-bold text-white mb-2">1. Minimum Withdrawal Threshold</h3>
            <p>
              The minimum payout threshold is strictly BDT 5,000 (৳5,000). A publisher's approved, available balance must be equal to or greater than ৳5,000 to initiate a withdrawal. Unpaid approved amounts roll over indefinitely into subsequent calendar months.
            </p>
          </div>

          <div>
            <h3 className="text-base font-bold text-white mb-2">2. Manual Mobile Wallet Disbursements</h3>
            <p>
              Disbursements are manually processed via official personal accounts on bKash and Nagad. Administrators verify recipient account numbers before transferring funds and provide an official Transaction Identifier (TrxID).
            </p>
          </div>

          <div>
            <h3 className="text-base font-bold text-white mb-2">3. Security Invariance & No Secret Requests</h3>
            <p>
              EarnBD and its representatives will NEVER ask for your bKash or Nagad Personal Identification Number (PIN), one-time passwords (OTP), or secret security codes.
            </p>
          </div>
        </div>
      )}

      {/* 3. PRIVACY POLICY */}
      {section === 'privacy' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 text-sm text-slate-300 leading-relaxed">
          <h2 className="text-xl font-bold text-white">Privacy Policy</h2>
          <p className="text-xs text-slate-400">Your privacy and financial security are our core priorities.</p>

          <div>
            <h3 className="text-base font-bold text-white mb-2">1. Information Collected</h3>
            <p>
              We collect your email address, display name, and designated 11-digit Bangladeshi mobile wallet number solely for authentication, account security, and payout execution.
            </p>
          </div>

          <div>
            <h3 className="text-base font-bold text-white mb-2">2. Firestore Database Security</h3>
            <p>
              All user ledger balances and transaction histories are stored on Google Cloud Firestore with zero-trust Attribute-Based Access Control (ABAC) rules. No publisher can access or query another user's financial documents.
            </p>
          </div>
        </div>
      )}

      {/* 4. CONTACT & SUPPORT */}
      {section === 'contact' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 text-sm text-slate-300 leading-relaxed">
          <h2 className="text-xl font-bold text-white">Contact & Support</h2>
          <p className="text-xs text-slate-400">Our Dhaka-based support team is available to assist publishers.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-start gap-3">
              <Mail className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-white">Email Inquiries</h4>
                <p className="text-xs text-slate-400 mt-1">support@earnbd.com</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Response within 24 business hours</p>
              </div>
            </div>

            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-start gap-3">
              <MessageSquare className="w-5 h-5 text-pink-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-white">Publisher Helpline</h4>
                <p className="text-xs text-slate-400 mt-1">+880 1700-EARNBD (Dhaka HQ)</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Sunday - Thursday: 10:00 AM - 6:00 PM BST</p>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
