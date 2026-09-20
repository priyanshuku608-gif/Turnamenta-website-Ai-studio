import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Save,
  QrCode,
  CreditCard,
  Gift,
  ShieldAlert,
  Mail,
  Send,
  Phone,
  Check,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { ref, set, serverTimestamp } from 'firebase/database';
import { db } from '../../lib/firebase';
import { useAdminData } from '../../context/AdminDataContext';
import { AppSettings } from '../../types';

export const SettingsScreen: React.FC = () => {
  const { settings } = useAdminData();

  const [upiId, setUpiId] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [referralBonus, setReferralBonus] = useState<number | ''>(10);
  const [minWithdrawal, setMinWithdrawal] = useState<number | ''>(50);
  const [maxWithdrawal, setMaxWithdrawal] = useState<number | ''>(10000);
  const [minDeposit, setMinDeposit] = useState<number | ''>(10);
  const [appVersion, setAppVersion] = useState('1.0.0');
  const [supportEmail, setSupportEmail] = useState('');
  const [telegramChannel, setTelegramChannel] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('Platform undergoing scheduled server maintenance. We will be back shortly!');

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (settings) {
      setUpiId(settings.upiId || '');
      setQrCodeUrl(settings.qrCodeUrl || '');
      setReferralBonus(settings.referralBonus !== undefined ? settings.referralBonus : 10);
      setMinWithdrawal(settings.minWithdrawal !== undefined ? settings.minWithdrawal : 50);
      setMaxWithdrawal(settings.maxWithdrawal !== undefined ? settings.maxWithdrawal : 10000);
      setMinDeposit(settings.minDeposit !== undefined ? settings.minDeposit : 10);
      setAppVersion(settings.appVersion || '1.0.0');
      setSupportEmail(settings.supportEmail || '');
      setTelegramChannel(settings.telegramChannel || '');
      setWhatsappNumber(settings.whatsappNumber || '');
      setMaintenanceMode(Boolean(settings.maintenanceMode));
      setMaintenanceMessage(settings.maintenanceMessage || 'Platform undergoing scheduled server maintenance. We will be back shortly!');
    }
  }, [settings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    try {
      await set(ref(db, 'settings'), {
        upiId: upiId.trim() || null,
        qrCodeUrl: qrCodeUrl.trim() || null,
        referralBonus: Number(referralBonus) || 0,
        minWithdrawal: Number(minWithdrawal) || 0,
        maxWithdrawal: Number(maxWithdrawal) || 0,
        minDeposit: Number(minDeposit) || 0,
        appVersion: appVersion.trim() || '1.0.0',
        supportEmail: supportEmail.trim() || null,
        telegramChannel: telegramChannel.trim() || null,
        whatsappNumber: whatsappNumber.trim() || null,
        maintenanceMode: Boolean(maintenanceMode),
        maintenanceMessage: maintenanceMessage.trim() || null,
        updatedAt: serverTimestamp(),
      });
      setSuccessMsg('Global platform settings updated successfully!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      alert('Failed to save settings: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide flex items-center gap-2.5">
            <SettingsIcon className="w-6 h-6 text-[#B6FF3C]" />
            <span>Global App & Payment Settings</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure payment gateways, UPI QR codes, withdrawal thresholds, and emergency maintenance mode.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-[#B6FF3C] hover:bg-[#a5e834] text-black font-extrabold text-xs rounded-xl flex items-center gap-2 transition active:scale-95 shadow-md shadow-[#B6FF3C]/20 disabled:opacity-50 cursor-pointer self-start sm:self-auto"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save Global Settings'}</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3.5 bg-emerald-950/70 border border-emerald-500/40 rounded-xl flex items-center gap-2.5 text-emerald-200 text-xs animate-fade-in">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Payment & QR Gateway Configuration */}
        <div className="bg-[#131C31] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-[#B6FF3C]" />
            <h2 className="text-sm font-bold text-white">Payment & Deposit Gateway (UPI)</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Admin UPI ID *</label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="e.g. yourbusiness@okaxis, merchant@upi"
                className="w-full bg-[#0A0F1D] border border-slate-700 focus:border-[#B6FF3C] rounded-xl px-3.5 py-2 text-white font-mono outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Payment QR Code Image URL</label>
              <input
                type="url"
                value={qrCodeUrl}
                onChange={(e) => setQrCodeUrl(e.target.value)}
                placeholder="https://example.com/payment-qr.png"
                className="w-full bg-[#0A0F1D] border border-slate-700 focus:border-[#B6FF3C] rounded-xl px-3.5 py-2 text-white outline-none"
              />
            </div>
          </div>

          {qrCodeUrl && (
            <div className="pt-2 flex items-center gap-4">
              <div className="w-20 h-20 bg-white p-1 rounded-xl overflow-hidden shrink-0">
                <img src={qrCodeUrl} alt="QR Code Preview" className="w-full h-full object-contain" />
              </div>
              <p className="text-xs text-slate-400">
                This QR Code is presented to users on their in-app deposit checkout screen.
              </p>
            </div>
          )}
        </div>

        {/* Financial Limits & Rules */}
        <div className="bg-[#131C31] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-amber-400" />
            <h2 className="text-sm font-bold text-white">Financial Limits & Referral Rewards</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Referral Bonus (₹)</label>
              <input
                type="number"
                min={0}
                value={referralBonus}
                onChange={(e) => setReferralBonus(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full bg-[#0A0F1D] border border-slate-700 focus:border-[#B6FF3C] rounded-xl px-3.5 py-2 text-white font-mono outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Min Deposit (₹)</label>
              <input
                type="number"
                min={1}
                value={minDeposit}
                onChange={(e) => setMinDeposit(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full bg-[#0A0F1D] border border-slate-700 focus:border-[#B6FF3C] rounded-xl px-3.5 py-2 text-white font-mono outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Min Withdrawal (₹)</label>
              <input
                type="number"
                min={1}
                value={minWithdrawal}
                onChange={(e) => setMinWithdrawal(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full bg-[#0A0F1D] border border-slate-700 focus:border-[#B6FF3C] rounded-xl px-3.5 py-2 text-white font-mono outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Max Withdrawal (₹)</label>
              <input
                type="number"
                min={1}
                value={maxWithdrawal}
                onChange={(e) => setMaxWithdrawal(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full bg-[#0A0F1D] border border-slate-700 focus:border-[#B6FF3C] rounded-xl px-3.5 py-2 text-white font-mono outline-none"
              />
            </div>
          </div>
        </div>

        {/* Support & Community Channels */}
        <div className="bg-[#131C31] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-400" />
            <span>Support & Community Links</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Support Email</label>
              <input
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                placeholder="support@battlepro.com"
                className="w-full bg-[#0A0F1D] border border-slate-700 focus:border-[#B6FF3C] rounded-xl px-3.5 py-2 text-white outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Telegram Channel Link</label>
              <input
                type="url"
                value={telegramChannel}
                onChange={(e) => setTelegramChannel(e.target.value)}
                placeholder="https://t.me/battlepro_official"
                className="w-full bg-[#0A0F1D] border border-slate-700 focus:border-[#B6FF3C] rounded-xl px-3.5 py-2 text-white outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">WhatsApp Helpline Number</label>
              <input
                type="text"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full bg-[#0A0F1D] border border-slate-700 focus:border-[#B6FF3C] rounded-xl px-3.5 py-2 text-white outline-none"
              />
            </div>
          </div>
        </div>

        {/* Maintenance Mode & App Version */}
        <div className="bg-[#131C31] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-400" />
            <h2 className="text-sm font-bold text-white">Emergency Maintenance & Version Gate</h2>
          </div>

          <div className="space-y-4 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-[#0A0F1D] border border-slate-800 rounded-xl">
              <div>
                <span className="font-bold text-white block text-sm">Maintenance Mode</span>
                <p className="text-slate-400 text-xs">
                  When enabled, all user app clients will display the maintenance message and pause match registrations.
                </p>
              </div>

              <label className="flex items-center gap-2 cursor-pointer self-start sm:self-auto">
                <input
                  type="checkbox"
                  checked={maintenanceMode}
                  onChange={(e) => setMaintenanceMode(e.target.checked)}
                  className="w-5 h-5 rounded text-red-500 focus:ring-0"
                />
                <span className={`font-bold ${maintenanceMode ? 'text-red-400' : 'text-slate-400'}`}>
                  {maintenanceMode ? 'ACTIVE (App Locked)' : 'Disabled'}
                </span>
              </label>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Maintenance Notice Message</label>
              <textarea
                rows={2}
                value={maintenanceMessage}
                onChange={(e) => setMaintenanceMessage(e.target.value)}
                className="w-full bg-[#0A0F1D] border border-slate-700 focus:border-[#B6FF3C] rounded-xl px-3.5 py-2 text-white outline-none"
              />
            </div>

            <div className="w-full sm:w-48 space-y-1">
              <label className="font-semibold text-slate-300">Current App Version</label>
              <input
                type="text"
                value={appVersion}
                onChange={(e) => setAppVersion(e.target.value)}
                placeholder="1.0.0"
                className="w-full bg-[#0A0F1D] border border-slate-700 focus:border-[#B6FF3C] rounded-xl px-3.5 py-2 text-white font-mono outline-none"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-[#B6FF3C] hover:bg-[#a5e834] text-black font-extrabold text-xs rounded-xl flex items-center gap-2 transition active:scale-95 shadow-lg shadow-[#B6FF3C]/20 disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save All Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
