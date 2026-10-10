import React, { useState } from 'react';
import { 
  X, 
  Mail, 
  Lock, 
  User, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  ShieldCheck 
} from 'lucide-react';
import { useAuth, ADMIN_BOOTSTRAP_EMAIL } from '../contexts/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultMode = 'login',
}) => {
  const { loginWithEmail, registerWithEmail, loginWithGoogle, resetPassword, t } = useAuth();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(defaultMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await loginWithEmail(email, password);
        onClose();
      } else if (mode === 'register') {
        await registerWithEmail(email, password, name || 'Publisher');
        setSuccessMsg('Account created! A verification link has been sent to your email.');
        setTimeout(() => onClose(), 1500);
      } else if (mode === 'forgot') {
        await resetPassword(email);
        setSuccessMsg('Password reset instructions sent to your email.');
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      let msg = err.message || 'Authentication failed';
      if (msg.includes('user-not-found') || msg.includes('wrong-password') || msg.includes('invalid-credential')) {
        msg = 'Invalid email or password. You can also sign in with Google or try the demo buttons.';
      } else if (msg.includes('email-already-in-use')) {
        msg = 'Email is already registered. Please sign in instead.';
      } else if (msg.includes('weak-password')) {
        msg = 'Password should be at least 6 characters.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
      onClose();
    } catch (err: any) {
      console.error('Google sign in error:', err);
      setError(err.message || 'Google Sign-In was cancelled or failed.');
    } finally {
      setLoading(false);
    }
  };

  // Quick Demo credentials for evaluation
  const setDemoPublisher = () => {
    setEmail('demo.publisher@earnbd.com');
    setPassword('DemoPass2026!');
    setName('Demo Publisher');
  };

  const setDemoAdmin = () => {
    setEmail(ADMIN_BOOTSTRAP_EMAIL);
    setPassword('AdminSecure2026!');
    setName('EarnBD Super Admin');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#0f172a] border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
            ৳
          </div>
          <h3 className="text-xl font-bold text-white">
            {mode === 'login' && t('authLoginTitle')}
            {mode === 'register' && t('authRegisterTitle')}
            {mode === 'forgot' && t('resetPassword')}
          </h3>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-950/40 border border-red-800/50 rounded-xl flex items-start gap-2 text-xs text-red-200">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-950/40 border border-emerald-800/50 rounded-xl flex items-start gap-2 text-xs text-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Google Popup Auth Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full py-2.5 px-4 mb-4 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2.5 transition active:scale-[0.98]"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          <span>{t('signInWithGoogle')}</span>
        </button>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-[#0f172a] px-2 text-slate-500 font-semibold">Or with Email</span>
          </div>
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'register' && (
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                {t('displayNameLabel')}
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Tanvir Ahmed"
                  className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder:text-slate-600 outline-none"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              {t('emailLabel')}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder:text-slate-600 outline-none"
                required
              />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-slate-300">
                  {t('passwordLabel')}
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-[11px] text-emerald-400 hover:underline"
                  >
                    {t('forgotPassword')}
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder:text-slate-600 outline-none"
                  required
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/20 transition active:scale-[0.98]"
          >
            {loading ? 'Processing...' : (
              mode === 'login' ? t('login') :
              mode === 'register' ? t('register') :
              t('resetPassword')
            )}
          </button>
        </form>

        {/* Mode switch links */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 text-center text-xs text-slate-400">
          {mode === 'login' && (
            <button
              onClick={() => { setMode('register'); setError(''); }}
              className="text-emerald-400 hover:underline font-semibold"
            >
              {t('dontHaveAccount')}
            </button>
          )}
          {(mode === 'register' || mode === 'forgot') && (
            <button
              onClick={() => { setMode('login'); setError(''); }}
              className="text-emerald-400 hover:underline font-semibold"
            >
              {t('alreadyHaveAccount')}
            </button>
          )}
        </div>

        {/* Quick Demo Pre-fill for reviewers */}
        <div className="mt-4 p-2.5 bg-slate-900/80 rounded-xl border border-slate-800 text-[11px]">
          <div className="text-slate-400 font-semibold mb-1.5 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            Quick Demo Autofill:
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={setDemoPublisher}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 transition"
            >
              Demo Publisher
            </button>
            <button
              type="button"
              onClick={setDemoAdmin}
              className="px-2 py-1 bg-amber-950/40 hover:bg-amber-900/40 text-amber-300 rounded border border-amber-800/50 transition font-medium"
            >
              Admin ({ADMIN_BOOTSTRAP_EMAIL.split('@')[0]})
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
