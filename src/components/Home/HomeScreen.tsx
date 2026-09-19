import React from 'react';
import { Calendar, PlayCircle, Trophy, ChevronDown, Gamepad2, Swords } from 'lucide-react';
import { useTournament } from '../../context/TournamentContext';
import { useAuth } from '../../context/AuthContext';
import { PromotionSlider } from './PromotionSlider';
import { TournamentCard } from './TournamentCard';
import { Tournament, Game } from '../../types';

interface HomeScreenProps {
  onDetailsClick: (t: Tournament) => void;
  onJoinClick: (t: Tournament) => void;
  onRoomKeyClick: (t: Tournament) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onDetailsClick,
  onJoinClick,
  onRoomKeyClick,
}) => {
  const { 
    tournaments, 
    games, 
    promotions, 
    loading, 
    selectedGameId, 
    setSelectedGameId,
    statusTab,
    setStatusTab
  } = useTournament();

  const { currentUser } = useAuth();

  // Active game list (from database or default modes if none configured)
  const defaultModes: Game[] = [
    { id: '1v1', name: '1 vs 1' },
    { id: '2v2', name: '2 vs 2' },
    { id: '1v2', name: '1 vs 2' },
    { id: 'squad', name: 'Squad Battle' },
  ];

  const activeGames: Game[] = games.length > 0 ? games : defaultModes;

  // Helper to strictly check if a tournament belongs to a game
  const isTournamentForGame = (t: Tournament, game: Game) => {
    if (t.gameId) {
      return (
        t.gameId === game.id || 
        t.gameId.toLowerCase() === game.name.toLowerCase().trim()
      );
    }
    // Fallback matching if gameId was not explicitly set on legacy record
    const gameName = game.name.toLowerCase().trim();
    const gameId = game.id.toLowerCase().trim();
    const tName = (t.name || '').toLowerCase();
    const tMode = (t.mode || '').toLowerCase();
    return (
      tName.includes(gameName) ||
      tMode.includes(gameName) ||
      tName.includes(gameId) ||
      tMode.includes(gameId)
    );
  };

  // Toggle game accordion
  const handleToggleGame = (gameId: string) => {
    if (selectedGameId === gameId) {
      setSelectedGameId(null); // Collapse if tapped again
    } else {
      setSelectedGameId(gameId); // Collapse others and expand tapped game
    }
  };

  return (
    <div className="space-y-5 pb-24 animate-fade-in">
      {/* 1. Hero Promo Banner Slider (BUG 1 FIX: Autoplay, Pause on Swipe, CSS Shimmer Sweep) */}
      <PromotionSlider promotions={promotions} />

      {/* 2. Esport Games Section with In-Place Accordion (BUG 2 FIX) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-1 h-5 bg-[#B6FF3C] rounded-full shadow-[0_0_8px_#B6FF3C]" />
            <h2 className="text-base font-bold text-white tracking-wide">
              Esport Games
            </h2>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">
            Tap a game to view matches
          </span>
        </div>

        {/* Accordion Game Tiles */}
        <div className="space-y-3">
          {activeGames.map((game) => {
            const isExpanded = selectedGameId === game.id;
            
            // Get all tournaments strictly matching this game
            const gameTournaments = tournaments.filter((t) => isTournamentForGame(t, game));
            
            // Filter by selected status tab
            const visibleTournaments = gameTournaments.filter((t) => {
              if (statusTab === 'upcoming') {
                return t.status === 'upcoming' || (!t.status && true);
              } else if (statusTab === 'ongoing') {
                return t.status === 'ongoing';
              } else if (statusTab === 'result') {
                return t.status === 'result' || t.status === 'completed';
              }
              return true;
            });

            return (
              <div
                key={game.id}
                className={`rounded-2xl overflow-hidden border transition-all duration-300 bg-[#1E293B] shadow-xl ${
                  isExpanded
                    ? 'border-[#B6FF3C] ring-2 ring-[#B6FF3C]/40 shadow-[0_0_20px_rgba(182,255,60,0.15)]'
                    : 'border-slate-700/80 hover:border-slate-600'
                }`}
              >
                {/* Game Tile Clickable Header */}
                <button
                  type="button"
                  onClick={() => handleToggleGame(game.id)}
                  className="w-full text-left flex items-center justify-between p-3 sm:p-3.5 bg-gradient-to-r from-[#1E293B] to-[#0F172A] hover:bg-slate-800/90 active:scale-[0.99] transition"
                  aria-expanded={isExpanded}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Game Artwork Thumbnail */}
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden bg-[#0F172A] border border-slate-700 shrink-0 relative shadow-md">
                      {game.imageUrl ? (
                        <img
                          src={game.imageUrl}
                          alt={game.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-tr from-[#0F172A] via-[#1E293B] to-[#334155] flex items-center justify-center">
                          <Gamepad2 className="w-6 h-6 text-[#B6FF3C]" />
                        </div>
                      )}
                    </div>

                    {/* Game Title & Match Count Badge */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-sm sm:text-base text-white tracking-wide truncate">
                          {game.name}
                        </h3>
                        {isExpanded && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-[#B6FF3C] text-black uppercase tracking-wider shrink-0">
                            Active
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] font-medium text-slate-400">
                          {gameTournaments.length}{' '}
                          {gameTournaments.length === 1 ? 'Tournament' : 'Tournaments'}
                        </span>
                        <span className="text-slate-600">•</span>
                        <span className="text-[11px] text-[#38BDF8] font-semibold">
                          {isExpanded ? 'Tap to collapse' : 'View matches'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Expand / Collapse Chevron */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border transition-all duration-300 ${
                      isExpanded
                        ? 'bg-[#B6FF3C] text-black border-[#B6FF3C] rotate-180 shadow-[0_0_10px_rgba(182,255,60,0.4)]'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    <ChevronDown className="w-4 h-4 stroke-[2.5]" />
                  </div>
                </button>

                {/* EXPANDED ACCORDION PANEL: Displays ONLY this game's tournaments */}
                {isExpanded && (
                  <div className="p-3 sm:p-4 border-t border-slate-700/80 bg-[#0B1120]/70 space-y-4 animate-fade-in">
                    {/* Status Tabs Switcher inside this Game */}
                    <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#0F172A] rounded-xl border border-slate-800">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setStatusTab('upcoming');
                        }}
                        className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition ${
                          statusTab === 'upcoming'
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Calendar className="w-3 h-3" />
                        <span>Upcoming</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setStatusTab('ongoing');
                        }}
                        className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition ${
                          statusTab === 'ongoing'
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <PlayCircle className="w-3 h-3" />
                        <span>Ongoing</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setStatusTab('result');
                        }}
                        className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition ${
                          statusTab === 'result'
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Trophy className="w-3 h-3" />
                        <span>Results</span>
                      </button>
                    </div>

                    {/* Tournaments List for this Game */}
                    <div className="space-y-3.5">
                      {loading ? (
                        /* Skeleton Loading State */
                        <div className="space-y-3">
                          {[1, 2].map((i) => (
                            <div
                              key={i}
                              className="bg-[#1E293B] border border-slate-800 rounded-xl p-3 animate-pulse space-y-2.5"
                            >
                              <div className="w-full aspect-[16/9] bg-slate-800/80 rounded-lg" />
                              <div className="h-4 bg-slate-800 rounded w-2/3" />
                              <div className="h-8 bg-slate-800/50 rounded-lg" />
                            </div>
                          ))}
                        </div>
                      ) : visibleTournaments.length === 0 ? (
                        /* Empty State inside Expanded Area */
                        <div className="text-center py-7 px-4 bg-[#0F172A]/80 border border-slate-800 rounded-xl space-y-2">
                          <Trophy className="w-8 h-8 text-slate-600 mx-auto" />
                          <h4 className="font-bold text-xs text-slate-300">
                            No tournaments for this game right now
                          </h4>
                          <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                            Admin schedules new cash matches regularly. Check back soon or switch status tabs.
                          </p>
                        </div>
                      ) : (
                        visibleTournaments.map((tournament) => (
                          <TournamentCard
                            key={tournament.id}
                            tournament={tournament}
                            onDetailsClick={onDetailsClick}
                            onJoinClick={onJoinClick}
                            onRoomKeyClick={onRoomKeyClick}
                          />
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
