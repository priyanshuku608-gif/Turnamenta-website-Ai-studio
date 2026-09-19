import React, { useState } from 'react';
import { 
  X, 
  ArrowLeft, 
  Wallet, 
  Check, 
  Copy, 
  QrCode, 
  ShieldCheck, 
  AlertCircle, 
  Clock, 
  ArrowRight,
  CreditCard
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTournament } from '../../context/TournamentContext';

interface RechargeWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const RechargeWizardModal: React.FC<RechargeWizardModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { userProfile } = useAuth();
  const { settings, createDepositRequest } = useTournament();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [amount, setAmount] = useState<number>(20);
  const [customAmount, setCustomAmount] = useState<string>('20');
  const [selectedMethod, setSelectedMethod] = useState<string>('upi');
  const [utr, setUtr] = useState<string>('');
  const [copiedUpi, setCopiedUpi] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentDepositBal = Number(userProfile?.depositBalance || userProfile?.balance || 0).toFixed(2);
  const quickAmounts = [20, 50, 100, 200, 500, 1000];

  const handleQuickAmountClick = (val: number) => {
    setAmount(val);
    setCustomAmount(String(val));
    setErrorMsg(null);
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    setCustomAmount(val);
    const num = Number(val);
    if (num > 0) {
      setAmount(num);
    }
    setErrorMsg(null);
  };

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount < 10 || amount > 1000) {
      setErrorMsg('Amount must be between ₹10 and ₹1000');
      return;
    }
    setErrorMsg(null);
    setStep(2);
  };

  const handleStep2Submit = () => {
    setStep(3);
  };

  const handleCopyUpi = () => {
    const upi = settings.upiDetails || 'battlepro@upi';
    navigator.clipboard.writeText(upi);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleStep3Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!utr.trim() || utr.trim().length < 6) {
      setErrorMsg('Please enter a valid 12-digit UTR / Reference number');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const res = await createDepositRequest(
      amount,
      selectedMethod,
      settings.upiDetails || 'battlepro@upi',
      utr.trim()
    );

    setLoading(false);

    if (res.success) {
      onSuccess();
      onClose();
      // Reset wizard
      setStep(1);
      setUtr('');
    } else {
      setErrorMsg(res.message);
    }
  };

  const handleBack = () => {
    if (step === 3) setStep(2);
    else if (step === 2) setStep(1);
    else onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-[#1E293B] border border-slate-700 rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl flex flex-col text-slate-100 overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-700/80">
          <div className="flex items-center gap-3">
            {step > 1 && (
              <button
                onClick={handleBack}
                className="p-1.5 rounded-full bg-slate-800 text-slate-300 hover:text-white transition"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div>
              <h2 className="font-bold text-base text-white">Recharge Wallet</h2>
              <span className="text-[11px] text-slate-400 font-medium">Step {step} of 3</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Balance Display */}
        <div className="text-center py-3 bg-[#0F172A] rounded-xl border border-slate-800 my-3">
          <div className="text-xs text-slate-400 font-medium">Current Deposit Balance</div>
          <div className="text-xl font-black text-white mt-0.5">₹{currentDepositBal}</div>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="mb-3 p-3 bg-red-950/60 border border-red-500/40 rounded-xl flex items-start gap-2 text-red-200 text-xs">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* STEP 1: Enter Amount */}
        {step === 1 && (
          <form onSubmit={handleStep1Submit} className="space-y-4 overflow-y-auto flex-1">
            <div className="bg-[#0F172A] p-4 rounded-xl border border-slate-800 space-y-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block text-center">
                Amount
              </span>

              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl font-black text-slate-400">₹</span>
                <input
                  type="text"
                  value={customAmount}
                  onChange={handleCustomAmountChange}
                  placeholder="10 - 1000"
                  maxLength={4}
                  className="w-48 bg-transparent text-center text-3xl font-black text-white tracking-wider outline-none border-b-2 border-slate-700 focus:border-[#B6FF3C] transition py-1"
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span>Minimum: ₹10</span>
                <span>Maximum: ₹1000</span>
              </div>
            </div>

            {/* Quick Amount Chips */}
            <div className="grid grid-cols-3 gap-2.5">
              {quickAmounts.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleQuickAmountClick(val)}
                  className={`py-3 rounded-xl font-bold text-sm transition-all active:scale-95 border ${
                    amount === val
                      ? 'bg-blue-600 border-blue-400 text-white shadow-md'
                      : 'bg-[#0F172A] border-slate-700 text-slate-200 hover:border-slate-600'
                  }`}
                >
                  ₹{val}
                </button>
              ))}
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition active:scale-98 shadow-lg"
            >
              <span>Continue to Payment</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* STEP 2: Select Payment Method */}
        {step === 2 && (
          <div className="space-y-4 overflow-y-auto flex-1">
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Select Payment Method
              </span>

              {[
                { id: 'upi', name: 'Instant UPI / Apps', desc: 'Google Pay, PhonePe, Paytm, BHIM' },
                { id: 'qr', name: 'Scan QR Code', desc: 'Pay via any scanning UPI app' },
                { id: 'gpay', name: 'Google Pay direct', desc: 'VPA Transfer' },
                { id: 'phonepe', name: 'PhonePe direct', desc: 'VPA Transfer' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedMethod(m.id)}
                  className={`w-full p-3.5 rounded-xl border text-left flex items-center justify-between transition-all active:scale-98 ${
                    selectedMethod === m.id
                      ? 'bg-blue-950/50 border-blue-500 ring-1 ring-blue-500'
                      : 'bg-[#0F172A] border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-blue-400">
                      {m.id === 'qr' ? <QrCode className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">{m.name}</div>
                      <div className="text-[10px] text-slate-400">{m.desc}</div>
                    </div>
                  </div>
                  {selectedMethod === m.id && (
                    <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            <button
              onClick={handleStep2Submit}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition active:scale-98 shadow-lg"
            >
              <span>Proceed to Pay ₹{amount}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 3: UPI / QR Details & Enter UTR */}
        {step === 3 && (
          <form onSubmit={handleStep3Submit} className="space-y-4 overflow-y-auto flex-1 pr-1">
            {/* Payment instructions box */}
            <div className="bg-[#0F172A] p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Amount to Pay:</span>
                <span className="text-base font-black text-[#B6FF3C]">₹{amount.toFixed(2)}</span>
              </div>

              {/* UPI ID copy box */}
              <div className="bg-[#1E293B] p-3 rounded-lg border border-slate-700 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Admin UPI ID</span>
                  <span className="text-sm font-mono font-bold text-white select-all">
                    {settings.upiDetails || 'battlepro@upi'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyUpi}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1 transition active:scale-95"
                >
                  {copiedUpi ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedUpi ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {/* QR Code if present */}
              {settings.qrCodeUrl && (
                <div className="text-center py-2">
                  <span className="text-[11px] text-slate-400 block mb-1.5">Or scan QR code to pay:</span>
                  <div className="w-32 h-32 mx-auto bg-white p-2 rounded-xl shadow-md">
                    <img
                      src={settings.qrCodeUrl}
                      alt="Payment QR"
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* UTR Input Field */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Enter 12-Digit UTR / Transaction Ref No.
              </label>
              <input
                type="text"
                placeholder="e.g. 329847192834"
                value={utr}
                onChange={(e) => setUtr(e.target.value)}
                maxLength={20}
                required
                className="w-full bg-[#0F172A] border border-slate-700 focus:border-[#B6FF3C] rounded-xl px-3.5 py-3 text-sm font-mono font-bold text-white placeholder-slate-500 outline-none transition"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Found in your Google Pay / PhonePe / Paytm payment receipt details.
              </p>
            </div>

            {/* Safety & Pending notice */}
            <div className="p-3 bg-amber-950/40 border border-amber-500/30 rounded-xl text-[11px] text-amber-200 flex items-start gap-2">
              <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                Your deposit request will be verified and approved by the admin within 10-30 minutes.
              </span>
            </div>

            <button
              type="submit"
              disabled={loading || !utr.trim()}
              className="w-full py-3.5 bg-[#B6FF3C] hover:bg-[#a5e834] text-black font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition active:scale-98 disabled:opacity-50 shadow-lg"
            >
              <span>{loading ? 'Submitting Request...' : 'Submit Deposit Request'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
