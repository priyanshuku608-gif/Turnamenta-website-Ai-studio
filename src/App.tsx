import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TournamentProvider, useTournament } from './context/TournamentContext';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { HomeScreen } from './components/Home/HomeScreen';
import { WalletScreen } from './components/Wallet/WalletScreen';
import { LeaderboardScreen } from './components/Leaderboard/LeaderboardScreen';
import { ProfileScreen } from './components/Profile/ProfileScreen';
import { TournamentDetailsModal } from './components/Tournament/TournamentDetailsModal';
import { JoinTournamentModal } from './components/Tournament/JoinTournamentModal';
import { RoomCredentialsModal } from './components/Tournament/RoomCredentialsModal';
import { NotificationsModal } from './components/NotificationsModal';
import { AuthModal } from './components/AuthModal';
import { ReferralPromptModal } from './components/ReferralPromptModal';
import { RechargeWizardModal } from './components/Wallet/RechargeWizardModal';
import { SplashScreen } from './components/SplashScreen';
import { TabType, Tournament } from './types';
import { CheckCircle2 } from 'lucide-react';

const MainApp: React.FC = () => {
  const { isAuthModalOpen, showReferralPrompt } = useAuth();
  const { selectedGameId, setSelectedGameId, games } = useTournament();

  const [showSplash, setShowSplash] = useState(true);
  const [currentTab, setCurrentTab] = useState<TabType>('home');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isRechargeOpen, setIsRechargeOpen] = useState(false);

  // Tournament Modal States
  const [selectedTournamentForDetails, setSelectedTournamentForDetails] = useState<Tournament | null>(null);
  const [selectedTournamentForJoin, setSelectedTournamentForJoin] = useState<Tournament | null>(null);
  const [selectedTournamentForRoomKey, setSelectedTournamentForRoomKey] = useState<Tournament | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Android System Back-button support
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      // If modal is open, close modal
      if (selectedTournamentForDetails) {
        setSelectedTournamentForDetails(null);
      } else if (selectedTournamentForJoin) {
        setSelectedTournamentForJoin(null);
      } else if (selectedTournamentForRoomKey) {
        setSelectedTournamentForRoomKey(null);
      } else if (isNotificationsOpen) {
        setIsNotificationsOpen(false);
      } else if (isRechargeOpen) {
        setIsRechargeOpen(false);
      } else if (selectedGameId) {
        setSelectedGameId(null);
      } else if (currentTab !== 'home') {
        setCurrentTab('home');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [
    selectedTournamentForDetails,
    selectedTournamentForJoin,
    selectedTournamentForRoomKey,
    isNotificationsOpen,
    isRechargeOpen,
    selectedGameId,
    currentTab,
    setSelectedGameId,
  ]);

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  const selectedGame = games.find((g) => g.id === selectedGameId);

  // Compute header title based on current screen
  const getHeaderTitle = () => {
    if (selectedGameId && selectedGame) {
      return selectedGame.name;
    }
    if (currentTab === 'wallet') return 'Wallet';
    if (currentTab === 'leaderboard') return 'Leaderboard';
    if (currentTab === 'profile') return 'Profile';
    return undefined;
  };

  const showBack = (currentTab !== 'home' || !!selectedGameId);

  const handleHeaderBack = () => {
    if (selectedGameId) {
      setSelectedGameId(null);
    } else if (currentTab !== 'home') {
      setCurrentTab('home');
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-100 flex justify-center selection:bg-[#B6FF3C] selection:text-black">
      {/* Mobile Wrapper Container */}
      <div className="w-full max-w-md min-h-screen flex flex-col bg-[#0F172A] border-x border-slate-800/80 shadow-2xl relative">
        {/* Global Toast */}
        {toastMessage && (
          <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-[#1E293B] border border-[#B6FF3C] px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-bold text-[#B6FF3C] animate-fade-in max-w-[90%]">
            <CheckCircle2 className="w-4 h-4 text-[#B6FF3C] shrink-0" />
            <span className="truncate">{toastMessage}</span>
          </div>
        )}

        {/* Sticky App Header */}
        <Header
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          title={getHeaderTitle()}
          showBack={showBack}
          onBack={handleHeaderBack}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
        />

        {/* Main Content Area */}
        <main className="flex-1 px-4 pt-4 overflow-y-auto">
          {currentTab === 'home' && (
            <HomeScreen
              onDetailsClick={(t) => setSelectedTournamentForDetails(t)}
              onJoinClick={(t) => setSelectedTournamentForJoin(t)}
              onRoomKeyClick={(t) => setSelectedTournamentForRoomKey(t)}
            />
          )}

          {currentTab === 'wallet' && (
            <WalletScreen />
          )}

          {currentTab === 'leaderboard' && (
            <LeaderboardScreen />
          )}

          {currentTab === 'profile' && (
            <ProfileScreen
              onRoomKeyClick={(t) => setSelectedTournamentForRoomKey(t)}
            />
          )}
        </main>

        {/* Persistent Bottom Nav */}
        <BottomNav currentTab={currentTab} setCurrentTab={setCurrentTab} />

        {/* --- Global Modals & Sheets --- */}

        {/* Tournament Details Modal */}
        <TournamentDetailsModal
          tournament={selectedTournamentForDetails}
          isOpen={!!selectedTournamentForDetails}
          onClose={() => setSelectedTournamentForDetails(null)}
          onJoinClick={(t) => setSelectedTournamentForJoin(t)}
          onRoomKeyClick={(t) => setSelectedTournamentForRoomKey(t)}
        />

        {/* Join Tournament Modal */}
        <JoinTournamentModal
          tournament={selectedTournamentForJoin}
          isOpen={!!selectedTournamentForJoin}
          onClose={() => setSelectedTournamentForJoin(null)}
          onOpenRecharge={() => setIsRechargeOpen(true)}
          onJoinedSuccess={(t) => {
            showToast(`Successfully registered for ${t.name}!`);
          }}
        />

        {/* Room Credentials Modal */}
        <RoomCredentialsModal
          tournament={selectedTournamentForRoomKey}
          isOpen={!!selectedTournamentForRoomKey}
          onClose={() => setSelectedTournamentForRoomKey(null)}
        />

        {/* Notifications Modal */}
        <NotificationsModal
          isOpen={isNotificationsOpen}
          onClose={() => setIsNotificationsOpen(false)}
        />

        {/* Quick Recharge Modal (triggered from Join or Header) */}
        <RechargeWizardModal
          isOpen={isRechargeOpen}
          onClose={() => setIsRechargeOpen(false)}
          onSuccess={() => {
            showToast('Deposit request submitted! Awaiting Admin approval.');
          }}
        />

        {/* Authentication Modal */}
        <AuthModal />

        {/* Referral Prompt Modal */}
        <ReferralPromptModal />
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <TournamentProvider>
        <MainApp />
      </TournamentProvider>
    </AuthProvider>
  );
}
