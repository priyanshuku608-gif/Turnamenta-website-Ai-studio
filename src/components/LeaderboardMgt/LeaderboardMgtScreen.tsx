import React, { useState, useEffect } from 'react';
import { Medal, Search, Save, Sparkles, Check, AlertCircle, Trash2 } from 'lucide-react';
import { ref, update } from 'firebase/database';
import { db } from '../../lib/firebase';
import { useAdminData } from '../../context/AdminDataContext';
import { UserProfile } from '../../types';

interface EditedRowState {
  rank: string; // string for input control
  displayEarnings: string;
}

export const LeaderboardMgtScreen: React.FC = () => {
  const { users } = useAdminData();
  const [searchTerm, setSearchTerm] = useState('');
  const [editState, setEditState] = useState<Record<string, EditedRowState>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Initialize editState from users data
  useEffect(() => {
    const initial: Record<string, EditedRowState> = {};
    users.forEach((u) => {
      initial[u.uid] = {
        rank: u.leaderboardRank !== undefined && u.leaderboardRank !== null ? String(u.leaderboardRank) : '',
        displayEarnings:
          u.leaderboardDisplayEarnings !== undefined && u.leaderboardDisplayEarnings !== null
            ? String(u.leaderboardDisplayEarnings)
            : u.totalEarnings !== undefined
            ? String(u.totalEarnings)
            : '',
      };
    });
    setEditState(initial);
    setHasChanges(false);
  }, [users]);

  const handleRankChange = (uid: string, value: string) => {
    setEditState((prev) => ({
      ...prev,
      [uid]: {
        ...prev[uid],
        rank: value,
      },
    }));
    setHasChanges(true);
  };

  const handleEarningsChange = (uid: string, value: string) => {
    setEditState((prev) => ({
      ...prev,
      [uid]: {
        ...prev[uid],
        displayEarnings: value,
      },
    }));
    setHasChanges(true);
  };

  const handleClearRank = (uid: string) => {
    handleRankChange(uid, '');
  };

  const handleSaveAll = async () => {
    setSaving(true);
    setSuccessMsg(null);
    try {
      // Build a multi-path batch update object
      const updates: Record<string, any> = {};

      Object.keys(editState).forEach((uid) => {
        const item = editState[uid];
        const rankVal = item.rank.trim() === '' ? null : parseInt(item.rank.trim(), 10);
        const earnVal = item.displayEarnings.trim() === '' ? null : parseFloat(item.displayEarnings.trim());

        updates[`users/${uid}/leaderboardRank`] = rankVal;
        updates[`users/${uid}/leaderboardDisplayEarnings`] = earnVal;
      });

      await update(ref(db), updates);
      setHasChanges(false);
      setSuccessMsg('Leaderboard rankings and display earnings updated successfully!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error('Failed to save leaderboard:', err);
      alert('Failed to save leaderboard changes: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Filter users by search term
  const filteredUsers = users.filter((u) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const nameMatch = (u.displayName || '').toLowerCase().includes(term);
    const emailMatch = (u.email || '').toLowerCase().includes(term);
    const uidMatch = u.uid.toLowerCase().includes(term);
    return nameMatch || emailMatch || uidMatch;
  });

  // Sort: Users with a rank first (sorted numerically by rank), then unranked
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    const rankA = editState[a.uid]?.rank ? parseInt(editState[a.uid].rank, 10) : 999999;
    const rankB = editState[b.uid]?.rank ? parseInt(editState[b.uid].rank, 10) : 999999;
    return rankA - rankB;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide flex items-center gap-2.5">
            <Medal className="w-6 h-6 text-amber-400" />
            <span>Manual Leaderboard Management</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manually curate the public leaderboard. Set custom ranks and display earnings per player, or leave rank blank to hide from public leaderboard.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSaveAll}
          disabled={saving || !hasChanges}
          className="px-4 py-2 bg-[#B6FF3C] hover:bg-[#a5e834] text-black font-extrabold text-xs rounded-xl flex items-center gap-2 transition active:scale-95 shadow-lg shadow-[#B6FF3C]/20 disabled:opacity-50 cursor-pointer self-start sm:self-auto"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving Changes...' : 'Save All Changes'}</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3.5 bg-emerald-950/70 border border-emerald-500/40 rounded-xl flex items-center gap-2.5 text-emerald-200 text-xs animate-fade-in">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Control / Search Bar */}
      <div className="bg-[#131C31] border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search players by name, email, or UID..."
            className="w-full bg-[#0A0F1D] border border-slate-700 focus:border-[#B6FF3C] rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none"
          />
        </div>

        <div className="text-xs text-slate-400 flex items-center gap-2">
          <span>Ranked Players:</span>
          <strong className="text-[#B6FF3C]">
            {Object.values(editState).filter((item) => item.rank.trim() !== '').length}
          </strong>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="bg-[#131C31] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-[#0B1120] text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4 w-28">Leaderboard Rank</th>
                <th className="py-3 px-4">Player</th>
                <th className="py-3 px-4 w-44">Display Earnings (₹)</th>
                <th className="py-3 px-4">Actual Wallet / Stats</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {sortedUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-500">
                    No users found matching search.
                  </td>
                </tr>
              ) : (
                sortedUsers.map((u) => {
                  const currentRank = editState[u.uid]?.rank ?? '';
                  const currentEarnings = editState[u.uid]?.displayEarnings ?? '';
                  const isRanked = currentRank.trim() !== '';

                  return (
                    <tr
                      key={u.uid}
                      className={`hover:bg-slate-800/40 transition ${
                        isRanked ? 'bg-[#1E293B]/30' : ''
                      }`}
                    >
                      {/* Rank Input */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={1}
                            placeholder="Unranked"
                            value={currentRank}
                            onChange={(e) => handleRankChange(u.uid, e.target.value)}
                            className={`w-20 bg-[#0A0F1D] border rounded-lg px-2.5 py-1.5 text-xs font-bold text-center outline-none ${
                              isRanked
                                ? 'border-[#B6FF3C] text-[#B6FF3C] bg-[#B6FF3C]/5'
                                : 'border-slate-700 text-slate-400'
                            }`}
                          />
                        </div>
                      </td>

                      {/* Player Info */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-white text-xs">
                          {u.displayName || 'Unnamed Player'}
                        </div>
                        <div className="text-[11px] text-slate-400">{u.email}</div>
                        <div className="font-mono text-[10px] text-slate-500 truncate max-w-[200px]">
                          UID: {u.uid}
                        </div>
                      </td>

                      {/* Display Earnings Input */}
                      <td className="py-3 px-4">
                        <div className="relative">
                          <span className="absolute left-2.5 top-1.5 text-slate-500 font-bold">₹</span>
                          <input
                            type="number"
                            min={0}
                            placeholder="0"
                            value={currentEarnings}
                            onChange={(e) => handleEarningsChange(u.uid, e.target.value)}
                            className="w-full bg-[#0A0F1D] border border-slate-700 focus:border-[#B6FF3C] rounded-lg pl-6 pr-2.5 py-1.5 text-xs text-white outline-none"
                          />
                        </div>
                      </td>

                      {/* Actual Stats */}
                      <td className="py-3 px-4 text-slate-300">
                        <div>
                          Balance: <strong className="text-white">₹{u.balance}</strong> (Win: ₹{u.winningCash})
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Matches: {u.totalMatches || 0} • Wins: {u.wonMatches || 0}
                        </div>
                      </td>

                      {/* Quick Clear */}
                      <td className="py-3 px-4 text-right">
                        {isRanked ? (
                          <button
                            type="button"
                            onClick={() => handleClearRank(u.uid)}
                            className="px-2 py-1 text-[11px] bg-red-950/50 hover:bg-red-900 border border-red-500/30 text-red-300 rounded-md transition"
                            title="Remove from Leaderboard"
                          >
                            Unrank
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-600 italic">Not Listed</span>
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
