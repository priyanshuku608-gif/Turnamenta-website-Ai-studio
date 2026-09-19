import React from 'react';
import { X, ShieldCheck, FileText, RefreshCw, Scale } from 'lucide-react';
import { useTournament } from '../../context/TournamentContext';

export type PolicyType = 'privacy' | 'terms' | 'refund' | 'fairplay';

interface PolicyModalProps {
  type: PolicyType | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PolicyModal: React.FC<PolicyModalProps> = ({ type, isOpen, onClose }) => {
  const { settings } = useTournament();

  if (!isOpen || !type) return null;

  const getDetails = () => {
    switch (type) {
      case 'privacy':
        return {
          title: 'Privacy Policy',
          icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />,
          content: settings.policyPrivacy || 'We are dedicated to safeguarding your personal data and gaming credentials. All transactions and authentication details are encrypted.',
        };
      case 'terms':
        return {
          title: 'Terms & Conditions',
          icon: <FileText className="w-5 h-5 text-blue-400" />,
          content: settings.policyTerms || 'By participating in Tournament Arena matches, you agree to adhere to competitive integrity, scheduled timings, and verified score submissions.',
        };
      case 'refund':
        return {
          title: 'Refund Policy',
          icon: <RefreshCw className="w-5 h-5 text-amber-400" />,
          content: settings.policyRefund || 'Entry fees will be fully refunded to your wallet if a match is cancelled by the administrator. Disqualifications due to cheating or no-show are non-refundable.',
        };
      case 'fairplay':
        return {
          title: 'Fair Play Policy',
          icon: <Scale className="w-5 h-5 text-[#B6FF3C]" />,
          content: settings.policyFairPlay || 'Cheating, hacking, scripts, emulators (in mobile-only matches), teaming with enemies, and verbal harassment will lead to immediate DQ and permanent account ban.',
        };
    }
  };

  const details = getDetails();

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-[#1E293B] border border-slate-700 rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl flex flex-col text-slate-100 overflow-hidden max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-700/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">
              {details.icon}
            </div>
            <h2 className="font-bold text-base text-white">{details.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="py-4 overflow-y-auto flex-1 text-xs text-slate-300 leading-relaxed whitespace-pre-line pr-1 space-y-3">
          <p>{details.content}</p>

          <div className="p-3 bg-[#0F172A] rounded-xl border border-slate-800 text-[11px] text-slate-400">
            For support inquiries or clarification regarding our platform rules, please reach out to our official Telegram support.
          </div>
        </div>

        {/* Footer */}
        <button
          onClick={onClose}
          className="w-full py-3 bg-slate-800 hover:bg-slate-700 font-semibold text-sm rounded-xl text-slate-200 transition"
        >
          Close
        </button>
      </div>
    </div>
  );
};
