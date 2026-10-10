import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot,
  runTransaction
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType, testFirestoreConnection } from '../firebase';
import { UserProfile, UserWallet } from '../types';
import { Language, translations } from '../utils/i18n';

export const ADMIN_BOOTSTRAP_EMAIL = 'mohistudio95@gmail.com';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  wallet: UserWallet | null;
  isAdmin: boolean;
  isLoading: boolean;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations['en'], params?: Record<string, string | number>) => string;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  logoutUser: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  resendVerification: () => Promise<void>;
  refreshWallet: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [wallet, setWallet] = useState<UserWallet | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [language, setLanguage] = useState<Language>('en');

  // Translation helper with parameter replacement
  const t = (key: keyof typeof translations['en'], params?: Record<string, string | number>): string => {
    let text = translations[language][key] || translations['en'][key] || String(key);
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      });
    }
    return text;
  };

  useEffect(() => {
    // Preserve a valid referral code while the visitor moves through registration.
    if (typeof window !== 'undefined') {
      const incomingRef = new URLSearchParams(window.location.search).get('ref');
      if (incomingRef && /^[A-Za-z0-9_-]{20,128}$/.test(incomingRef)) {
        window.sessionStorage.setItem('earnbd_referral_code', incomingRef);
      }
    }
    testFirestoreConnection();

    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      setCurrentUser(fbUser);
      if (fbUser) {
        await initUserProfileAndWallet(fbUser);
      } else {
        setUserProfile(null);
        setWallet(null);
        setIsLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Listen to live wallet updates when user changes
  useEffect(() => {
    if (!currentUser) return;

    const walletRef = doc(db, 'wallets', currentUser.uid);
    const unsubWallet = onSnapshot(walletRef, (snapshot) => {
      if (snapshot.exists()) {
        setWallet(snapshot.data() as UserWallet);
      }
    }, (error) => {
      console.warn('Wallet snapshot error:', error);
    });

    return () => unsubWallet();
  }, [currentUser]);

  const initUserProfileAndWallet = async (fbUser: FirebaseUser) => {
    try {
      const userRef = doc(db, 'users', fbUser.uid);
      const userSnap = await getDoc(userRef);

      const isBootstrapAdmin = fbUser.email?.toLowerCase() === ADMIN_BOOTSTRAP_EMAIL.toLowerCase() && Boolean(fbUser.emailVerified);

      let profileData: UserProfile;

      if (!userSnap.exists()) {
        profileData = {
          uid: fbUser.uid,
          email: fbUser.email || '',
          displayName: fbUser.displayName || 'Publisher',
          role: isBootstrapAdmin ? 'admin' : 'user',
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await setDoc(userRef, profileData);
      } else {
        profileData = userSnap.data() as UserProfile;
        // Ensure bootstrap admin keeps admin status
        if (isBootstrapAdmin && profileData.role !== 'admin') {
          profileData.role = 'admin';
          await setDoc(userRef, { role: 'admin' }, { merge: true });
        }
      }
      setUserProfile(profileData);

      // If admin, record admin document
      if (isBootstrapAdmin || profileData.role === 'admin') {
        const adminRef = doc(db, 'admins', fbUser.uid);
        await setDoc(adminRef, { admin: true, email: fbUser.email }, { merge: true });
      }

      // Initialize Wallet if doesn't exist
      const walletRef = doc(db, 'wallets', fbUser.uid);
      const walletSnap = await getDoc(walletRef);
      if (!walletSnap.exists()) {
        const initialWallet: UserWallet = {
          uid: fbUser.uid,
          availableBalance: 0,
          reservedBalance: 0,
          pendingCommission: 0,
          lifetimeApproved: 0,
          paidCommission: 0,
          currentMonthApproved: 0,
          previousMonthApproved: 0,
          updatedAt: new Date().toISOString()
        };
        await setDoc(walletRef, initialWallet);
        setWallet(initialWallet);
      } else {
        setWallet(walletSnap.data() as UserWallet);
      }

      // Referral attribution is processed only by the trusted Netlify function.
      // The function verifies the Firebase ID token and the 30-day bonus stays pending.
      await claimReferralIfPresent(fbUser);
    } catch (err) {
      console.error('Failed to initialize user profile or wallet:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const claimReferralIfPresent = async (fbUser: FirebaseUser) => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const code = window.sessionStorage.getItem('earnbd_referral_code') || params.get('ref');
    if (!code || !/^[A-Za-z0-9_-]{20,128}$/.test(code)) return;

    try {
      const token = await fbUser.getIdToken();
      const response = await fetch('/.netlify/functions/referral', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ action: 'claim', referrerUid: code })
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        window.sessionStorage.removeItem('earnbd_referral_code');
      } else if (response.status < 500) {
        // Do not keep an invalid or ineligible code retrying forever.
        window.sessionStorage.removeItem('earnbd_referral_code');
        console.warn('Referral attribution was not accepted:', data.error || response.statusText);
      } else {
        console.warn('Referral service temporarily unavailable; code retained for retry.');
      }
    } catch (error) {
      console.warn('Referral claim could not be submitted:', error);
    }
  };

  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      handleFirestoreError(error, OperationType.GET, 'auth/google');
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const registerWithEmail = async (email: string, pass: string, name: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    if (cred.user) {
      try {
        await sendEmailVerification(cred.user);
      } catch (e) {
        console.warn('Could not send verification email:', e);
      }
    }
  };

  const logoutUser = async () => {
    await signOut(auth);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const resendVerification = async () => {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
    }
  };

  const refreshWallet = async () => {
    if (!currentUser) return;
    try {
      const walletSnap = await getDoc(doc(db, 'wallets', currentUser.uid));
      if (walletSnap.exists()) {
        setWallet(walletSnap.data() as UserWallet);
      }
    } catch (e) {
      console.error('Wallet refresh error:', e);
    }
  };

  const isAdmin = userProfile?.role === 'admin' || (currentUser?.email?.toLowerCase() === ADMIN_BOOTSTRAP_EMAIL.toLowerCase() && Boolean(currentUser?.emailVerified));

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        wallet,
        isAdmin,
        isLoading,
        language,
        setLanguage,
        t,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        logoutUser,
        resetPassword,
        resendVerification,
        refreshWallet
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
