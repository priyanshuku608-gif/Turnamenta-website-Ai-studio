import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { TournamentProvider } from './context/TournamentContext';
import { TabType, Tournament, Game } from './types';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { HomeScreen } from './components/Home/HomeScreen';
import { GameTournamentsScreen } from './components/Game/GameTournamentsScreen';
import { WalletScreen } from './components/Wallet/WalletScreen';
import { LeaderboardScreen } from './components/Leaderboard/LeaderboardScreen';
import { ProfileScreen } from './components/Profile/ProfileScreen';
import { SplashScreen } from './components/SplashScreen';
import { AuthModal } from './components/AuthModal';
import { NotificationsModal } from './components/NotificationsModal';
import { ReferralPromptModal } from './components/ReferralPromptModal';
import { TournamentDetailsModal } from './components/Tournament/TournamentDetailsModal';
import { JoinTournamentModal } from './components/Tournament/JoinTournamentModal';
import { RoomCredentialsModal } from './components/Tournament/RoomCredentialsModal';
import { RechargeWizardModal } from './components/Wallet/RechargeWizardModal';

const UserAppContent: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<TabType>('home');
  const [activeGame, setActiveGame] = useState<Game | null>(null);
  const [showSplash, setShowSplash] = useState(true);

  // Tournament Interaction Modals
  const [detailsTournament, setDetailsTournament] = useState<Tournament | null>(null);
  const [joinTournamentItem, setJoinTournamentItem] = useState<Tournament | null>(null);
  const [roomKeyTournament, setRoomKeyTournament] = useState<Tournament | null>(null);

  // Secondary Global Modals
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isRechargeModalOpen, setIsRechargeModalOpen] = useState(false);

  const handleTabChange = (tab: TabType) => {
    if (tab === 'home' && currentTab === 'home') {
      // Tapping Home again returns to main Home from sub-screens
      setActiveGame(null);
    }
    setCurrentTab(tab);
  };

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-100 flex flex-col font-['Poppins',sans-serif] selection:bg-[#B6FF3C] selection:text-black">
      {/* Splash Screen */}
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}

      {/* Main Container - Constrained to max-w-md for mobile-first app experience */}
      <div className="w-full max-w-md mx-auto min-h-screen flex flex-col relative bg-[#0B1120] shadow-2xl border-x border-slate-800/40">
        {/* Global Header */}
        <Header
          currentTab={currentTab}
          setCurrentTab={handleTabChange}
          showBack={currentTab === 'home' && !!activeGame}
          onBack={() => setActiveGame(null)}
          title={currentTab === 'home' && activeGame ? activeGame.name : undefined}
          customIconUrl={currentTab === 'home' && activeGame ? activeGame.imageUrl : undefined}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
        />

        {/* Tab Content */}
        <main className="flex-1 px-4 pt-3 pb-20">
          {currentTab === 'home' && (
            activeGame ? (
              <GameTournamentsScreen
                game={activeGame}
                onDetailsClick={(t) => setDetailsTournament(t)}
                onJoinClick={(t) => setJoinTournamentItem(t)}
                onRoomKeyClick={(t) => setRoomKeyTournament(t)}
              />
            ) : (
              <HomeScreen
                onSelectGame={(g) => setActiveGame(g)}
                onDetailsClick={(t) => setDetailsTournament(t)}
                onJoinClick={(t) => setJoinTournamentItem(t)}
                onRoomKeyClick={(t) => setRoomKeyTournament(t)}
              />
            )
          )}

          {currentTab === 'wallet' && <WalletScreen />}

          {currentTab === 'leaderboard' && <LeaderboardScreen />}

          {currentTab === 'profile' && (
            <ProfileScreen onRoomKeyClick={(t) => setRoomKeyTournament(t)} />
          )}
        </main>

        {/* Global Bottom Navigation */}
        <BottomNav currentTab={currentTab} setCurrentTab={handleTabChange} />

        {/* Modals & Dialogs */}
        <AuthModal />
        <NotificationsModal
          isOpen={isNotificationsOpen}
          onClose={() => setIsNotificationsOpen(false)}
        />
        <ReferralPromptModal />

        {/* Tournament Modals */}
        <TournamentDetailsModal
          isOpen={!!detailsTournament}
          tournament={detailsTournament}
          onClose={() => setDetailsTournament(null)}
          onJoinClick={(t) => {
            setDetailsTournament(null);
            setJoinTournamentItem(t);
          }}
          onRoomKeyClick={(t) => {
            setDetailsTournament(null);
            setRoomKeyTournament(t);
          }}
        />

        <JoinTournamentModal
          isOpen={!!joinTournamentItem}
          tournament={joinTournamentItem}
          onClose={() => setJoinTournamentItem(null)}
          onOpenRecharge={() => {
            setJoinTournamentItem(null);
            setIsRechargeModalOpen(true);
          }}
          onJoinedSuccess={(t) => {
            setJoinTournamentItem(null);
            setDetailsTournament(t);
          }}
        />

        <RoomCredentialsModal
          isOpen={!!roomKeyTournament}
          tournament={roomKeyTournament}
          onClose={() => setRoomKeyTournament(null)}
        />

        <RechargeWizardModal
          isOpen={isRechargeModalOpen}
          onClose={() => setIsRechargeModalOpen(false)}
          onSuccess={() => setIsRechargeModalOpen(false)}
        />
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <TournamentProvider>
        <UserAppContent />
      </TournamentProvider>
    </AuthProvider>
  );
}
