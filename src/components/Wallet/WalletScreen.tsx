import React, { useState } from 'react';
import { 
  Wallet as WalletIcon, 
  Plus, 
  ChevronRight, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ArrowDownLeft, 
  ArrowUpRight,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTournament } from '../../context/TournamentContext';
import { RechargeWizardModal } from './RechargeWizardModal';
import { WithdrawModal } from './WithdrawModal';

interface WalletScreenProps {
  onHistoryClick?: () => void;
}

export const WalletScreen: React.FC<WalletScreenProps> = () => {
  const { currentUser, userProfile, openAuthModal } = useAuth();
  const { transactions } = useTournament();

  const [isRechargeOpen, setIsRechargeOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState<string | null>(null);

  const depositBal = Number(userProfile?.depositBalance || userProfile?.balance || 0).toFixed(2);
  const winningCash = Number(userProfile?.winningCash || 0).toFixed(2);
  const bonusCash = Number(userProfile?.bonusCash || 0).toFixed(2);

  const handleAddAmount = () => {
    if (!currentUser) {
      openAuthModal(() => setIsRechargeOpen(true));
    } else {
      setIsRechargeOpen(true);
    }
  };

  const handleWithdraw = () => {
    if (!currentUser) {
      openAuthModal(() => setIsWithdrawOpen(true));
    } else {
      setIsWithdrawOpen(true);
    }
  };

  const formatTxTime = (ts: number | string) => {
    const d = new Date(Number(ts));
    if (isNaN(d.getTime())) return '';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year}, ${hours}:${mins}`;
  };

  return (
    <div className="space-y-6 pb-24 animate-fade-in">
      {/* Toast Notification */}
      {showSuccessToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-[#1E293B] border border-[#B6FF3C] px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-bold text-[#B6FF3C] animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-[#B6FF3C]" />
          <span>{showSuccessToast}</span>
        </div>
      )}

      {/* 1. Wallet Balance Card (Matching Screenshot 2) */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-1 h-5 bg-[#B6FF3C] rounded-full shadow-[0_0_8px_#B6FF3C]" />
          <h2 className="text-base font-bold text-white tracking-wide">
            Wallet
          </h2>
        </div>

        <div className="bg-[#1E293B] border border-slate-700/80 rounded-2xl p-5 shadow-xl space-y-4">
          {/* Row 1: Deposit Balance */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-medium block">Deposit Balance</span>
              <span className="text-2xl font-black text-white tracking-tight">₹{depositBal}</span>
            </div>
            <button
              onClick={() => {
                const el = document.getElementById('recent-tx-section');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-xs text-[#B6FF3C] font-semibold flex items-center gap-0.5 hover:underline"
            >
              <span>History</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Dotted Divider */}
          <div className="border-b border-dashed border-slate-700/70" />

          {/* Row 2: Winning Cash */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-medium block">Winning Cash</span>
              <span className="text-2xl font-black text-white tracking-tight">₹{winningCash}</span>
            </div>
            <button
              onClick={handleWithdraw}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition active:scale-95"
            >
              Withdraw
            </button>
          </div>

          {/* Dotted Divider */}
          <div className="border-b border-dashed border-slate-700/70" />

          {/* Row 3: Bonus Cash */}
          <div>
            <span className="text-xs text-slate-400 font-medium block">Bonus Cash</span>
            <span className="text-2xl font-black text-white tracking-tight">₹{bonusCash}</span>
          </div>

          {/* Action Button: + Add Amount */}
          <button
            onClick={handleAddAmount}
            className="w-full py-3.5 bg-[#0F172A] hover:bg-slate-900 border border-slate-700 hover:border-slate-600 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition active:scale-98 shadow-md"
          >
            <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center">
              <Plus className="w-3.5 h-3.5 text-[#B6FF3C]" />
            </div>
            <span>Add Amount</span>
          </button>
        </div>
      </div>

      {/* 2. Recent Transactions Section (Matching Screenshot 2) */}
      <div id="recent-tx-section" className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-1 h-5 bg-[#B6FF3C] rounded-full shadow-[0_0_8px_#B6FF3C]" />
          <h2 className="text-base font-bold text-white tracking-wide">
            Recent Transactions
          </h2>
        </div>

        <div className="space-y-2.5">
          {!currentUser ? (
            <div className="bg-[#1E293B] border border-slate-800 rounded-2xl p-6 text-center space-y-3">
              <WalletIcon className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400">Sign in to view your real-time deposit and withdrawal logs.</p>
              <button
                onClick={() => openAuthModal()}
                className="px-4 py-2 bg-[#B6FF3C] text-black font-bold text-xs rounded-xl shadow-sm"
              >
                Sign In
              </button>
            </div>
          ) : transactions.length === 0 ? (
            <div className="bg-[#1E293B] border border-slate-800 rounded-2xl p-8 text-center space-y-2">
              <Clock className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-sm font-bold text-slate-300">No Transactions Yet</p>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Your recharge history and payout requests will appear here with live status updates.
              </p>
            </div>
          ) : (
            transactions.map((tx) => {
              const isApproved = tx.status === 'success' || tx.status === 'approved' || tx.status === 'completed';
              const isRejected = tx.status === 'rejected';
              const isPending = tx.status === 'pending';
              const isDeposit = tx.type.toLowerCase().includes('deposit');

              const statusColor = isApproved ? 'text-emerald-400' : isRejected ? 'text-red-400' : 'text-amber-400';
              const amountColor = isApproved
                ? (isDeposit ? 'text-emerald-400' : 'text-slate-200')
                : (isRejected ? 'text-red-400' : 'text-amber-400');

              return (
                <div
                  key={tx.id}
                  className="bg-[#1E293B] border border-slate-700/80 rounded-2xl p-4 flex items-center justify-between shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#0F172A] border border-slate-800 flex items-center justify-center">
                      {isDeposit ? (
                        <ArrowDownLeft className={`w-5 h-5 ${isApproved ? 'text-emerald-400' : isRejected ? 'text-red-400' : 'text-amber-400'}`} />
                      ) : (
                        <ArrowUpRight className="w-5 h-5 text-blue-400" />
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-white">{tx.type}</div>
                      <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                        <span>{formatTxTime(tx.timestamp)}</span>
                        <span>·</span>
                        <span className={`font-bold capitalize ${statusColor}`}>
                          {tx.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`text-base font-black ${amountColor}`}>
                      {isApproved && isDeposit ? '+' : ''}₹{Number(tx.amount).toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Recharge Wizard Modal */}
      <RechargeWizardModal
        isOpen={isRechargeOpen}
        onClose={() => setIsRechargeOpen(false)}
        onSuccess={() => {
          setShowSuccessToast('Deposit request submitted! Admin will verify soon.');
          setTimeout(() => setShowSuccessToast(null), 4000);
        }}
      />

      {/* Withdraw Modal */}
      <WithdrawModal
        isOpen={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
        onSuccess={() => {
          setShowSuccessToast('Withdrawal request submitted successfully.');
          setTimeout(() => setShowSuccessToast(null), 4000);
        }}
      />
    </div>
  );
};
