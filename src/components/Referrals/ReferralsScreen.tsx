import React, { useState } from 'react';
import {
  Gift,
  Search,
  CheckCircle2,
  Clock,
  UserCheck,
  DollarSign,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { ref, get, update, push, set, serverTimestamp } from 'firebase/database';
import { db } from '../../lib/firebase';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { useAdminData } from '../../context/AdminDataContext';
import { ReferralRecord } from '../../types';

export const ReferralsScreen: React.FC = () => {
  const { referrals, users, settings } = useAdminData();
  const { adminConfig, currentUser } = useAdminAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState(false);

  const defaultReferralBonus = Number(settings?.referralBonus) || 10;

  const userMap = React.useMemo(() => {
    const map: Record<string, { name: string; email: string; balance: number }> = {};
    users.forEach((u) => {
      map[u.uid] = {
        name: u.displayName || 'Player',
        email: u.email || '',
        balance: Number(u.balance) || 0,
      };
    });
    return map;
  }, [users]);

  // Handle Credit Bonus
  const handleCreditBonus = async (refItem: ReferralRecord) => {
    const bonusToCredit = Number(refItem.bonusAmount) || defaultReferralBonus;
    const referrerInfo = userMap[refItem.referrerUid];
    const referredInfo = userMap[refItem.referredUid];

    if (
      !confirm(
        `Credit referral bonus of ₹${bonusToCredit} to referrer ${
          referrerInfo?.name || refItem.referrerUid
        }?`
      )
    ) {
      return;
    }

    setActionLoading(true);
    try {
      const adminUid = adminConfig?.adminUid || currentUser?.uid || 'admin';

      // 1. Read referrer user profile
      const userSnap = await get(ref(db, `users/${refItem.referrerUid}`));
      const userData = userSnap.val() || {};

      const currentBalance = Number(userData.balance) || 0;
      const currentBonus = Number(userData.bonusCash) || 0;
      const currentRefEarnings = Number(userData.referralEarnings) || 0;

      const newBalance = currentBalance + bonusToCredit;
      const newBonus = currentBonus + bonusToCredit;
      const newRefEarnings = currentRefEarnings + bonusToCredit;

      // 2. Update referrer user node
      await update(ref(db, `users/${refItem.referrerUid}`), {
        balance: newBalance,
        bonusCash: newBonus,
        referralEarnings: newRefEarnings,
        updatedAt: serverTimestamp(),
      });

      // 3. Mark referral record as credited
      await update(ref(db, `referrals/${refItem.id}`), {
        status: 'credited',
        bonusAmount: bonusToCredit,
        processedAt: serverTimestamp(),
        processedBy: adminUid,
      });

      // 4. Write transaction log
      const newTxRef = push(ref(db, `transactions/${refItem.referrerUid}`));
      await set(newTxRef, {
        userId: refItem.referrerUid,
        userEmail: userData.email || referrerInfo?.email,
        type: 'referral_bonus',
        amount: bonusToCredit,
        isCredit: true,
        status: 'completed',
        description: `Referral bonus credited for user ${referredInfo?.email || refItem.referredUid}`,
        balanceAfter: newBalance,
        timestamp: serverTimestamp(),
        adminUid,
      });
    } catch (err: any) {
      console.error('Error crediting referral bonus:', err);
      alert('Failed to credit bonus: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Filter logic
  const filteredReferrals = referrals.filter((r) => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const referrer = userMap[r.referrerUid];
      const referred = userMap[r.referredUid];
      const matchReferrer =
        (referrer?.name || '').toLowerCase().includes(term) ||
        (referrer?.email || '').toLowerCase().includes(term) ||
        (r.referrerUid || '').toLowerCase().includes(term);
      const matchReferred =
        (referred?.name || '').toLowerCase().includes(term) ||
        (referred?.email || '').toLowerCase().includes(term) ||
        (r.referredUid || '').toLowerCase().includes(term);
      return matchReferrer || matchReferred;
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide flex items-center gap-2.5">
            <Gift className="w-6 h-6 text-[#B6FF3C]" />
            <span>Referral Network & Bonus Credits</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Track user invitations and credit promotional bonus cash to verified referrers.
          </p>
        </div>

        <div className="px-3.5 py-1.5 bg-[#131C31] border border-slate-700 rounded-xl text-xs text-slate-300 flex items-center gap-2">
          <span>Global Bonus Setting:</span>
          <strong className="text-[#B6FF3C]">₹{defaultReferralBonus} / Invite</strong>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#131C31] border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Filter Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#0A0F1D] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-[#B6FF3C]"
          >
            <option value="all">All Referrals</option>
            <option value="pending">Pending Credit</option>
            <option value="credited">Credited</option>
          </select>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by referrer or referee..."
            className="w-full bg-[#0A0F1D] border border-slate-700 rounded-xl pl-9 pr-3.5 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-[#B6FF3C]"
          />
        </div>
      </div>

      {/* Referrals Table */}
      <div className="bg-[#131C31] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-[#0B1120] text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4">Referrer (Inviter)</th>
                <th className="py-3 px-4"></th>
                <th className="py-3 px-4">Referred Player (Invitee)</th>
                <th className="py-3 px-4">Bonus Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredReferrals.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-14 text-slate-500">
                    No referral records matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredReferrals.map((r) => {
                  const referrer = userMap[r.referrerUid];
                  const referred = userMap[r.referredUid];
                  const isPending = r.status === 'pending';
                  const bonus = r.bonusAmount || defaultReferralBonus;

                  return (
                    <tr key={r.id} className="hover:bg-slate-800/40 transition">
                      {/* Referrer */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-white text-xs">
                          {referrer?.name || 'Player'}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {referrer?.email || r.referrerUid}
                        </div>
                      </td>

                      {/* Arrow */}
                      <td className="py-3 px-1 text-slate-600">
                        <ArrowRight className="w-4 h-4" />
                      </td>

                      {/* Referred */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-white text-xs">
                          {referred?.name || 'New Player'}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {referred?.email || r.referredUid}
                        </div>
                      </td>

                      {/* Bonus */}
                      <td className="py-3 px-4">
                        <span className="font-bold text-amber-300 font-mono">
                          ₹{bonus}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize inline-block ${
                            r.status === 'credited'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          }`}
                        >
                          {r.status || 'pending'}
                        </span>
                      </td>

                      {/* Timestamp */}
                      <td className="py-3 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                        {r.timestamp ? new Date(r.timestamp).toLocaleDateString() : '—'}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right">
                        {isPending ? (
                          <button
                            type="button"
                            onClick={() => handleCreditBonus(r)}
                            disabled={actionLoading}
                            className="px-3 py-1 bg-[#B6FF3C] hover:bg-[#a5e834] text-black font-extrabold rounded-lg text-xs flex items-center gap-1 transition cursor-pointer active:scale-95"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Credit Bonus</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-500 flex items-center justify-end gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Credited</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
