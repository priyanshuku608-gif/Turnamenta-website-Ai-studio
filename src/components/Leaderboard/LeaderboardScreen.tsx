import React from 'react';
import { Trophy, Award, Medal, Crown } from 'lucide-react';
import { useTournament } from '../../context/TournamentContext';

export const LeaderboardScreen: React.FC = () => {
  const { leaderboard, loading } = useTournament();

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <div className="w-10 h-10 rounded-2xl bg-[#B6FF3C] text-black font-black text-sm flex items-center justify-center shadow-[0_0_12px_rgba(182,255,60,0.5)]">
          #1
        </div>
      );
    }
    return (
      <div className="w-9 h-9 rounded-xl bg-[#0F172A] border border-slate-700 text-slate-400 font-bold text-xs flex items-center justify-center">
        #{rank}
      </div>
    );
  };

  const getAvatarBg = (name: string, index: number) => {
    const colors = [
      'bg-indigo-600',
      'bg-emerald-600',
      'bg-rose-600',
      'bg-purple-600',
      'bg-cyan-600',
      'bg-amber-600',
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="space-y-4 pb-24 animate-fade-in">
      {/* Heading */}
      <div className="flex items-center gap-2">
        <span className="w-1 h-5 bg-[#B6FF3C] rounded-full shadow-[0_0_8px_#B6FF3C]" />
        <h2 className="text-base font-bold text-white tracking-wide">
          Top Players
        </h2>
      </div>

      {/* Leaderboard List */}
      <div className="space-y-2.5">
        {loading && leaderboard.length === 0 ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-[#1E293B] border border-slate-800 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="bg-[#1E293B] border border-slate-800 rounded-2xl p-8 text-center space-y-2">
            <Trophy className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-sm font-bold text-slate-300">Leaderboard Loading...</p>
            <p className="text-xs text-slate-500">
              Rankings update dynamically as players win tournaments.
            </p>
          </div>
        ) : (
          leaderboard.map((player, index) => {
            const rank = player.rank || index + 1;
            const isFirst = rank === 1;
            const initial = (player.displayName?.charAt(0) || 'P').toUpperCase();

            return (
              <div
                key={player.uid || index}
                className={`bg-[#1E293B] rounded-2xl p-3.5 flex items-center justify-between transition-all duration-200 shadow-md ${
                  isFirst
                    ? 'border-2 border-[#B6FF3C]/80 shadow-[0_0_15px_rgba(182,255,60,0.15)] ring-1 ring-[#B6FF3C]/40'
                    : 'border border-slate-700/80 hover:border-slate-600'
                }`}
              >
                {/* Left: Rank + Avatar + Name */}
                <div className="flex items-center gap-3 min-w-0">
                  {getRankBadge(rank)}

                  {/* Player Avatar */}
                  <div className="relative">
                    {player.photoURL ? (
                      <img
                        src={player.photoURL}
                        alt={player.displayName}
                        className="w-11 h-11 rounded-full object-cover border border-slate-600"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div
                        className={`w-11 h-11 rounded-full ${getAvatarBg(player.displayName, index)} flex items-center justify-center font-bold text-white text-base border border-slate-600/60`}
                      >
                        {initial}
                      </div>
                    )}

                    {isFirst && (
                      <Crown className="w-4 h-4 text-amber-400 absolute -top-1.5 -right-1.5 fill-amber-400 stroke-[1.5]" />
                    )}
                  </div>

                  {/* Player Name */}
                  <div className="min-w-0">
                    <div className="font-bold text-sm text-white truncate max-w-[140px] sm:max-w-[180px]">
                      {player.displayName}
                    </div>
                    {player.wonMatches !== undefined && player.wonMatches > 0 && (
                      <div className="text-[10px] text-slate-400">
                        {player.wonMatches} wins
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Total Earnings */}
                <div className="text-right pl-2 shrink-0">
                  <span
                    className={`text-base font-black tracking-tight ${
                      isFirst ? 'text-[#B6FF3C]' : 'text-emerald-400'
                    }`}
                  >
                    ₹{player.totalEarnings.toFixed(0)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
