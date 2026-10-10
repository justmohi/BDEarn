/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { Footer } from './components/Footer';
import { AuthModal } from './components/AuthModal';
import { WithdrawalModal } from './components/WithdrawalModal';
import { HomePage } from './pages/HomePage';
import { DashboardPage } from './pages/DashboardPage';
import { WithdrawPage } from './pages/WithdrawPage';
import { AdminPage } from './pages/AdminPage';
import { PolicyPage } from './pages/PolicyPage';

function AppContent() {
  const { currentUser, isAdmin } = useAuth();

  const [currentTab, setCurrentTab] = useState<string>('home');
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState<boolean>(false);
  const [policySection, setPolicySection] = useState<'privacy' | 'terms' | 'adPolicy' | 'contact'>('adPolicy');

  const handleNavigatePolicy = (section: 'privacy' | 'terms' | 'adPolicy' | 'contact') => {
    setPolicySection(section);
    setCurrentTab('policy');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#090d1a] text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenAuth={() => setShowAuthModal(true)}
        onOpenWithdraw={() => setShowWithdrawModal(true)}
      />

      {/* Main Page Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {currentTab === 'home' && (
          <HomePage
            onOpenAuth={() => setShowAuthModal(true)}
            onNavigateTab={setCurrentTab}
            onOpenWithdraw={() => setShowWithdrawModal(true)}
          />
        )}

        {currentTab === 'directory' && (
          <HomePage
            onOpenAuth={() => setShowAuthModal(true)}
            onNavigateTab={setCurrentTab}
            onOpenWithdraw={() => setShowWithdrawModal(true)}
          />
        )}

        {currentTab === 'dashboard' && (
          <DashboardPage
            onOpenWithdraw={() => setShowWithdrawModal(true)}
            onOpenAuth={() => setShowAuthModal(true)}
          />
        )}

        {currentTab === 'withdraw' && (
          <WithdrawPage
            onOpenAuth={() => setShowAuthModal(true)}
            onNavigateTab={setCurrentTab}
          />
        )}

        {currentTab === 'admin' && (
          <AdminPage />
        )}

        {currentTab === 'policy' && (
          <PolicyPage initialSection={policySection} />
        )}
      </main>

      {/* Bottom Footer */}
      <Footer onNavigatePolicy={handleNavigatePolicy} />

      {/* Responsive Mobile Bottom Nav */}
      <BottomNav
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenAuth={() => setShowAuthModal(true)}
      />

      {/* Global Modals */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

      <WithdrawalModal
        isOpen={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
