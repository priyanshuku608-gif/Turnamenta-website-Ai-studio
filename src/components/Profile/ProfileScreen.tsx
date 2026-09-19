import React, { useState } from 'react';
import { 
  Bell, 
  Clock, 
  UserPlus, 
  Send, 
  ShieldCheck, 
  FileText, 
  RefreshCw, 
  Scale, 
  LogOut, 
  LogIn, 
  Edit3, 
  ChevronRight, 
  User as UserIcon,
  Trophy,
  Swords,
  Award
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTournament } from '../../context/TournamentContext';
import { ReferAndEarnModal } from './ReferAndEarnModal';
import { MatchHistoryModal } from './MatchHistoryModal';
import { PolicyModal, PolicyType } from './PolicyModal';
import { EditNameModal } from './EditNameModal';
import { Tournament } from '../../types';

interface ProfileScreenProps {
  onRoomKeyClick: (t: Tournament) => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onRoomKeyClick }) => {
  const { currentUser, userProfile, signOutUser, openAuthModal } = useAuth();
  const { settings } = useTournament();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isReferModalOpen, setIsReferModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isEditNameOpen, setIsEditNameOpen] = useState(false);
  const [activePolicy, setActivePolicy] = useState<PolicyType | null>(null);

  const displayName = userProfile?.displayName || currentUser?.displayName || 'Player';
  const email = userProfile?.email || currentUser?.email || 'player@battlepro.app';
  const initial = (displayName.charAt(0) || 'P').toUpperCase();

  const totalMatches = userProfile?.totalMatches || 0;
  const wonMatches = userProfile?.wonMatches || 0;
  const totalWinnings = Number(userProfile?.totalEarnings || userProfile?.winningCash || 0).toFixed(2);

  const handleTelegramClick = () => {
    const link = settings.telegramLink || 'https://t.me/battlepro_support';
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  const handleProtectedAction = (action: () => void) => {
    if (!currentUser) {
      openAuthModal(action);
    } else {
      action();
    }
  };

  return (
    <div className="space-y-6 pb-24 animate-fade-in">
      {/* 1. Profile Identity Header (Matching Screenshot 3) */}
      <div className="text-center pt-2 space-y-3">
        {/* Large Circular Avatar with Neon Green Border */}
        <div className="relative inline-block">
          {currentUser && userProfile?.photoURL ? (
            <img
              src={userProfile.photoURL}
              alt={displayName}
              className="w-24 h-24 rounded-full object-cover border-4 border-[#B6FF3C] shadow-[0_0_20px_rgba(182,255,60,0.35)]"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-[#0F172A] border-4 border-[#B6FF3C] flex items-center justify-center font-black text-3xl text-[#B6FF3C] shadow-[0_0_20px_rgba(182,255,60,0.35)]">
              {currentUser ? initial : <UserIcon className="w-10 h-10 text-slate-500" />}
            </div>
          )}
        </div>

        {/* Name and Email */}
        <div>
          <div className="flex items-center justify-center gap-2">
            <h2 className="text-xl font-extrabold text-white tracking-wide">
              {currentUser ? displayName : 'Guest Player'}
            </h2>
            {currentUser && (
              <button
                onClick={() => setIsEditNameOpen(true)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                aria-label="Edit Name"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {currentUser ? email : 'Sign in to sync your match stats & wallet'}
          </p>
        </div>
      </div>

      {/* 2. Stats 3-Column Bar (Matching Screenshot 3) */}
      <div className="bg-[#1E293B] border border-slate-700/80 rounded-2xl p-4 shadow-xl grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="text-xl font-black text-white">{totalMatches}</div>
          <div className="text-[11px] text-slate-400 font-medium mt-0.5">Matches Played</div>
        </div>

        <div className="border-x border-slate-700/80">
          <div className="text-xl font-black text-white">{wonMatches}</div>
          <div className="text-[11px] text-slate-400 font-medium mt-0.5">Matches Won</div>
        </div>

        <div>
          <div className="text-xl font-black text-[#B6FF3C]">₹{totalWinnings}</div>
          <div className="text-[11px] text-slate-400 font-medium mt-0.5">Total Winnings</div>
        </div>
      </div>

      {/* 3. Menu List (Matching Screenshot 3) */}
      <div className="bg-[#1E293B] border border-slate-700/80 rounded-2xl overflow-hidden shadow-xl divide-y divide-slate-800/80">
        {/* Notifications Toggle */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0F172A] flex items-center justify-center text-[#B6FF3C]">
              <Bell className="w-5 h-5" />
            </div>
            <span className="text-sm font-semibold text-white">Notifications</span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={notificationsEnabled}
              onChange={() => setNotificationsEnabled(!notificationsEnabled)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#B6FF3C]"></div>
          </label>
        </div>

        {/* Match History */}
        <button
          onClick={() => handleProtectedAction(() => setIsHistoryModalOpen(true))}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-800/40 transition active:scale-98"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0F172A] flex items-center justify-center text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-sm font-semibold text-white">Match History</span>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400" />
        </button>

        {/* Refer & Earn */}
        <button
          onClick={() => handleProtectedAction(() => setIsReferModalOpen(true))}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-800/40 transition active:scale-98"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0F172A] flex items-center justify-center text-emerald-400">
              <UserPlus className="w-5 h-5" />
            </div>
            <span className="text-sm font-semibold text-white">Refer & Earn</span>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400" />
        </button>

        {/* Contact Us on Telegram */}
        <button
          onClick={handleTelegramClick}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-800/40 transition active:scale-98"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0F172A] flex items-center justify-center text-cyan-400">
              <Send className="w-5 h-5" />
            </div>
            <span className="text-sm font-semibold text-white">Contact Us on Telegram</span>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400" />
        </button>

        {/* Privacy Policy */}
        <button
          onClick={() => setActivePolicy('privacy')}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-800/40 transition active:scale-98"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0F172A] flex items-center justify-center text-indigo-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="text-sm font-semibold text-white">Privacy Policy</span>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400" />
        </button>

        {/* Terms & Conditions */}
        <button
          onClick={() => setActivePolicy('terms')}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-800/40 transition active:scale-98"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0F172A] flex items-center justify-center text-blue-400">
              <FileText className="w-5 h-5" />
            </div>
            <span className="text-sm font-semibold text-white">Terms & Conditions</span>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400" />
        </button>

        {/* Refund Policy */}
        <button
          onClick={() => setActivePolicy('refund')}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-800/40 transition active:scale-98"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0F172A] flex items-center justify-center text-yellow-400">
              <RefreshCw className="w-5 h-5" />
            </div>
            <span className="text-sm font-semibold text-white">Refund Policy</span>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400" />
        </button>

        {/* Fair Play Policy */}
        <button
          onClick={() => setActivePolicy('fairplay')}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-800/40 transition active:scale-98"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0F172A] flex items-center justify-center text-[#B6FF3C]">
              <Scale className="w-5 h-5" />
            </div>
            <span className="text-sm font-semibold text-white">Fair Play Policy</span>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400" />
        </button>

        {/* Logout / Sign In */}
        {currentUser ? (
          <button
            onClick={() => signOutUser()}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-red-950/20 transition active:scale-98"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#0F172A] flex items-center justify-center text-red-400">
                <LogOut className="w-5 h-5" />
              </div>
              <span className="text-sm font-semibold text-red-400">Log Out</span>
            </div>
            <ChevronRight className="w-5 h-5 text-red-400" />
          </button>
        ) : (
          <button
            onClick={() => openAuthModal()}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-blue-950/20 transition active:scale-98"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#0F172A] flex items-center justify-center text-[#B6FF3C]">
                <LogIn className="w-5 h-5" />
              </div>
              <span className="text-sm font-semibold text-[#B6FF3C]">Sign In</span>
            </div>
            <ChevronRight className="w-5 h-5 text-[#B6FF3C]" />
          </button>
        )}
      </div>

      {/* Sub-Modals */}
      <ReferAndEarnModal
        isOpen={isReferModalOpen}
        onClose={() => setIsReferModalOpen(false)}
      />

      <MatchHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        onRoomKeyClick={onRoomKeyClick}
      />

      <PolicyModal
        type={activePolicy}
        isOpen={!!activePolicy}
        onClose={() => setActivePolicy(null)}
      />

      <EditNameModal
        isOpen={isEditNameOpen}
        onClose={() => setIsEditNameOpen(false)}
      />
    </div>
  );
};
