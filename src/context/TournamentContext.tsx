import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { 
  ref, 
  onValue, 
  get, 
  push, 
  set, 
  update, 
  runTransaction, 
  query, 
  orderByChild, 
  equalTo,
  off 
} from 'firebase/database';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { 
  Tournament, 
  Game, 
  Promotion, 
  AppSettings, 
  Deposit, 
  Withdrawal, 
  TransactionRecord, 
  LeaderboardItem,
  UserNotification
} from '../types';

interface TournamentContextType {
  tournaments: Tournament[];
  games: Game[];
  promotions: Promotion[];
  settings: AppSettings;
  deposits: Deposit[];
  withdrawals: Withdrawal[];
  transactions: TransactionRecord[];
  leaderboard: LeaderboardItem[];
  notifications: UserNotification[];
  unreadNotificationCount: number;
  loading: boolean;
  isTimedOut: boolean;
  selectedGameId: string | null;
  setSelectedGameId: (id: string | null) => void;
  statusTab: 'upcoming' | 'ongoing' | 'result';
  setStatusTab: (tab: 'upcoming' | 'ongoing' | 'result') => void;
  joinTournament: (tournamentId: string, username: string, gameUid: string, teammateUsername?: string, teammateGameUid?: string) => Promise<{ success: boolean; message: string }>;
  createDepositRequest: (amount: number, paymentMethod: string, upiId: string, utr: string) => Promise<{ success: boolean; message: string; depositId?: string }>;
  createWithdrawalRequest: (amount: number, methodName: string, accountInfo: string) => Promise<{ success: boolean; message: string }>;
  markNotificationsAsRead: () => void;
}

const defaultSettings: AppSettings = {
  appName: 'BattlePro',
  minWithdraw: 50,
  referralBonus: 10,
  signupBonus: 10,
  supportContact: 'support@battlepro.app',
  telegramLink: 'https://t.me/battlepro_support',
  upiDetails: 'battlepro@upi',
  qrCodeUrl: '',
  policyPrivacy: 'We value your privacy. Your information is encrypted and never shared.',
  policyTerms: 'By playing, you agree to fair play rules and terms of Tournament Arena.',
  policyRefund: 'Refunds are granted if a match is cancelled by the administrator.',
  policyFairPlay: 'Cheating, hacking, or using third-party tools will result in a permanent ban.',
};

const TournamentContext = createContext<TournamentContextType | null>(null);

export const TournamentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, userProfile } = useAuth();
  
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [rawLeaderboard, setRawLeaderboard] = useState<LeaderboardItem[]>([]);
  const [allUsersList, setAllUsersList] = useState<LeaderboardItem[]>([]);
  const [globalNotifications, setGlobalNotifications] = useState<UserNotification[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [isTimedOut, setIsTimedOut] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [statusTab, setStatusTab] = useState<'upcoming' | 'ongoing' | 'result'>('upcoming');

  // Soft timeout of 6.5s as in existing web app
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsTimedOut(true);
      setLoading(false);
    }, 6500);

    return () => clearTimeout(timer);
  }, []);

  // Listen to Tournaments
  useEffect(() => {
    const tournamentsRef = ref(db, 'tournaments');
    const unsubscribe = onValue(tournamentsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const list: Tournament[] = Object.entries(data).map(([id, item]: [string, any]) => ({
          ...item,
          id,
        }));
        setTournaments(list);
      } else {
        setTournaments([]);
      }
      setLoading(false);
    }, (error) => {
      console.warn("Tournaments listener warning:", error);
      setLoading(false);
    });

    return () => {
      off(tournamentsRef);
    };
  }, []);

  // Listen to Games
  useEffect(() => {
    const gamesRef = ref(db, 'games');
    const unsubscribe = onValue(gamesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const list: Game[] = Object.entries(data).map(([id, item]: [string, any]) => ({
          ...item,
          id,
        }));
        setGames(list);
      } else {
        setGames([]);
      }
    }, (err) => console.warn("Games listener err:", err));

    return () => {
      off(gamesRef);
    };
  }, []);

  // Listen to Promotions
  useEffect(() => {
    const promotionsRef = ref(db, 'promotions');
    const unsubscribe = onValue(promotionsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const list: Promotion[] = Object.entries(data).map(([id, item]: [string, any]) => ({
          ...item,
          id,
        }));
        setPromotions(list);
      } else {
        setPromotions([]);
      }
    }, (err) => console.warn("Promotions listener err:", err));

    return () => {
      off(promotionsRef);
    };
  }, []);

  // Listen to Settings
  useEffect(() => {
    const settingsRef = ref(db, 'settings');
    const unsubscribe = onValue(settingsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val() as AppSettings;
        setSettings({ ...defaultSettings, ...data });
      }
    }, (err) => console.warn("Settings listener err:", err));

    return () => {
      off(settingsRef);
    };
  }, []);

  // Listen to Global Notifications
  useEffect(() => {
    const notifRef = ref(db, 'notifications');
    const unsubscribe = onValue(notifRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const list: UserNotification[] = Object.entries(data).map(([id, item]: [string, any]) => ({
          id,
          title: item.title || 'Notification',
          message: item.message || '',
          type: item.type || 'info',
          timestamp: item.timestamp || Date.now(),
        }));
        setGlobalNotifications(list);
      } else {
        setGlobalNotifications([]);
      }
    }, (err) => console.warn("Notifications listener err:", err));

    return () => {
      off(notifRef);
    };
  }, []);

  // Listen to Leaderboard node and fallback to all users for ranking
  useEffect(() => {
    const leaderboardRef = ref(db, 'leaderboard');
    const unsubscribeLeaderboard = onValue(leaderboardRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const list: LeaderboardItem[] = Object.entries(data).map(([uid, item]: [string, any]) => ({
          uid,
          displayName: item.displayName || item.name || 'Player',
          totalEarnings: Number(item.totalEarnings || item.winnings || item.amount || 0),
          wonMatches: item.wonMatches || item.wins || 0,
          totalMatches: item.totalMatches || 0,
          photoURL: item.photoURL || '',
        }));
        setRawLeaderboard(list);
      } else {
        setRawLeaderboard([]);
      }
    }, (err) => console.warn("Leaderboard err:", err));

    const usersRef = ref(db, 'users');
    const unsubscribeUsers = onValue(usersRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const list: LeaderboardItem[] = Object.entries(data).map(([uid, item]: [string, any]) => ({
          uid,
          displayName: item.displayName || item.username || 'Player',
          totalEarnings: Number(item.totalEarnings || item.winningCash || 0),
          wonMatches: item.wonMatches || 0,
          totalMatches: item.totalMatches || 0,
          photoURL: item.photoURL || '',
        }));
        setAllUsersList(list);
      }
    }, (err) => console.warn("Users for leaderboard err:", err));

    return () => {
      off(leaderboardRef);
      off(usersRef);
    };
  }, []);

  // Compute final sorted Leaderboard
  const leaderboard = useMemo(() => {
    const source = rawLeaderboard.length > 0 ? rawLeaderboard : allUsersList;
    const sorted = [...source].sort((a, b) => (b.totalEarnings || 0) - (a.totalEarnings || 0));
    return sorted.map((item, index) => ({
      ...item,
      rank: index + 1,
    }));
  }, [rawLeaderboard, allUsersList]);

  // Listen to User Deposits and Withdrawals
  useEffect(() => {
    if (!currentUser) {
      setDeposits([]);
      setWithdrawals([]);
      return;
    }

    const depositsRef = ref(db, 'deposits');
    const depositsQuery = query(depositsRef, orderByChild('userId'), equalTo(currentUser.uid));
    const unsubscribeDeposits = onValue(depositsQuery, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const list: Deposit[] = Object.entries(data).map(([id, item]: [string, any]) => ({
          ...item,
          id,
        }));
        // sort newest first
        list.sort((a, b) => Number(b.timestamp) - Number(a.timestamp));
        setDeposits(list);
      } else {
        setDeposits([]);
      }
    }, (err) => console.warn("Deposits query err:", err));

    const withdrawalsRef = ref(db, 'withdrawals');
    const withdrawalsQuery = query(withdrawalsRef, orderByChild('userId'), equalTo(currentUser.uid));
    const unsubscribeWithdrawals = onValue(withdrawalsQuery, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const list: Withdrawal[] = Object.entries(data).map(([id, item]: [string, any]) => ({
          ...item,
          id,
        }));
        list.sort((a, b) => Number(b.requestTimestamp) - Number(a.requestTimestamp));
        setWithdrawals(list);
      } else {
        setWithdrawals([]);
      }
    }, (err) => console.warn("Withdrawals query err:", err));

    return () => {
      off(depositsRef);
      off(withdrawalsRef);
    };
  }, [currentUser]);

  // Combine User Notifications
  const notifications = useMemo(() => {
    const userNotifs = userProfile?.notifications 
      ? Object.entries(userProfile.notifications).map(([id, item]) => ({
          ...item,
          id,
        }))
      : [];
    const combined = [...globalNotifications, ...userNotifs];
    combined.sort((a, b) => Number(b.timestamp) - Number(a.timestamp));
    return combined;
  }, [globalNotifications, userProfile?.notifications]);

  const unreadNotificationCount = useMemo(() => {
    const lastChecked = Number(userProfile?.lastCheckedNotifications) || 0;
    return notifications.filter(n => Number(n.timestamp) > lastChecked).length;
  }, [notifications, userProfile?.lastCheckedNotifications]);

  const markNotificationsAsRead = async () => {
    if (currentUser) {
      await update(ref(db, `users/${currentUser.uid}`), {
        lastCheckedNotifications: Date.now(),
      });
    }
  };

  // Convert Deposits and Withdrawals into combined Transaction history
  const transactions: TransactionRecord[] = useMemo(() => {
    const items: TransactionRecord[] = [];
    
    deposits.forEach(d => {
      items.push({
        id: d.id,
        type: 'Deposit',
        amount: d.amount,
        timestamp: d.timestamp,
        status: d.status,
        description: `Deposit via ${d.paymentMethod.toUpperCase()} (UTR: ${d.utr})`,
      });
    });

    withdrawals.forEach(w => {
      items.push({
        id: w.id,
        type: 'Withdrawal',
        amount: w.amount,
        timestamp: w.requestTimestamp,
        status: w.status,
        description: `Payout to ${w.methodDetails?.methodName || 'Account'} (${w.methodDetails?.accountInfo || ''})`,
      });
    });

    items.sort((a, b) => Number(b.timestamp) - Number(a.timestamp));
    return items;
  }, [deposits, withdrawals]);

  // JOIN TOURNAMENT WITH TWO-PHASE TRANSACTION & REFUND LOGIC
  const joinTournament = async (
    tournamentId: string, 
    username: string, 
    gameUid: string,
    teammateUsername?: string,
    teammateGameUid?: string
  ): Promise<{ success: boolean; message: string }> => {
    if (!currentUser || !userProfile) {
      return { success: false, message: 'Please sign in to join tournaments' };
    }

    // 1. Fetch current tournament data
    const tourneySnap = await get(ref(db, `tournaments/${tournamentId}`));
    if (!tourneySnap.exists()) {
      return { success: false, message: 'Tournament not found' };
    }

    const tourney = tourneySnap.val() as Tournament;
    if (tourney.status !== 'upcoming' && tourney.status !== 'ongoing') {
      return { success: false, message: 'Tournament registration is closed' };
    }

    const isDuo = (tourney.mode || '').toLowerCase().includes('duo');
    const totalFee = tourney.entryFee * (isDuo ? 2 : 1);

    // Check if already registered
    if (tourney.registeredPlayers && tourney.registeredPlayers[currentUser.uid]) {
      return { success: false, message: 'You have already joined this tournament' };
    }

    const currentRegisteredCount = tourney.registeredPlayers ? Object.keys(tourney.registeredPlayers).length : 0;
    if (currentRegisteredCount >= tourney.maxPlayers) {
      return { success: false, message: 'Tournament is full' };
    }

    // Check balance
    const depositBal = Number(userProfile.depositBalance || userProfile.balance || 0);
    const winningBal = Number(userProfile.winningCash || 0);
    const totalAvailable = depositBal + winningBal;

    if (totalAvailable < totalFee) {
      return { 
        success: false, 
        message: `Insufficient balance! You need ₹${totalFee}, but have ₹${totalAvailable.toFixed(2)}. Please recharge your wallet.` 
      };
    }

    // Determine exact deduction split: depositBalance first, then winningCash
    let deductFromDeposit = Math.min(depositBal, totalFee);
    let deductFromWinning = totalFee - deductFromDeposit;

    let walletDebited = false;
    let actualDeductedDeposit = 0;
    let actualDeductedWinning = 0;

    // STEP 1: Debit Wallet via atomic transaction on users/{uid}
    const userRef = ref(db, `users/${currentUser.uid}`);
    try {
      const debitResult = await runTransaction(userRef, (currentData) => {
        if (!currentData) return currentData;
        const curDep = Number(currentData.depositBalance || currentData.balance || 0);
        const curWin = Number(currentData.winningCash || 0);
        
        if (curDep + curWin < totalFee) {
          return; // Abort transaction
        }

        const depCut = Math.min(curDep, totalFee);
        const winCut = totalFee - depCut;

        actualDeductedDeposit = depCut;
        actualDeductedWinning = winCut;

        const newDep = curDep - depCut;
        const newWin = curWin - winCut;

        return {
          ...currentData,
          depositBalance: newDep,
          balance: newDep, // keep legacy field in sync
          winningCash: newWin,
          totalMatches: (currentData.totalMatches || 0) + 1,
          username: username,
          gameUid: gameUid,
        };
      });

      if (!debitResult.committed) {
        return { success: false, message: 'Failed to deduct entry fee. Please try again.' };
      }
      walletDebited = true;
    } catch (err: any) {
      return { success: false, message: err.message || 'Transaction error during wallet debit' };
    }

    // STEP 2: Reserve player slot in tournament
    const tourneyRegRef = ref(db, `tournaments/${tournamentId}/registeredPlayers/${currentUser.uid}`);
    try {
      const playerPayload = {
        joinedAt: Date.now(),
        username,
        gameUid,
        ...(isDuo ? { teammateUsername: teammateUsername || '', teammateGameUid: teammateGameUid || '' } : {})
      };

      await set(tourneyRegRef, playerPayload);

      // Record in user's joinedTournaments
      await update(ref(db, `users/${currentUser.uid}/joinedTournaments`), {
        [tournamentId]: true,
      });

      // Add in-app notification
      const notifKey = `join_${tournamentId}_${Date.now()}`;
      await set(ref(db, `users/${currentUser.uid}/notifications/${notifKey}`), {
        title: 'Tournament Joined!',
        message: `You successfully registered for "${tourney.name}". Check Room ID & Password 15 min before match start.`,
        type: 'match_start',
        timestamp: Date.now(),
      });

      return { 
        success: true, 
        message: `Successfully joined "${tourney.name}"! Entry fee of ₹${totalFee} deducted.` 
      };
    } catch (regError: any) {
      console.error("Player slot reservation failed. Initiating compensating refund...", regError);

      // Compensating refund if Step 2 failed after Step 1 committed
      if (walletDebited) {
        try {
          await runTransaction(userRef, (currentData) => {
            if (!currentData) return currentData;
            return {
              ...currentData,
              depositBalance: (currentData.depositBalance || 0) + actualDeductedDeposit,
              balance: (currentData.balance || 0) + actualDeductedDeposit,
              winningCash: (currentData.winningCash || 0) + actualDeductedWinning,
              totalMatches: Math.max(0, (currentData.totalMatches || 1) - 1),
            };
          });
        } catch (refundErr) {
          console.error("Critical: Compensating refund failed. Contact support.", refundErr);
        }
      }

      return { 
        success: false, 
        message: 'Could not complete registration. Tournament may be full. Your wallet balance has been refunded.' 
      };
    }
  };

  // CREATE DEPOSIT REQUEST (3-Step Wizard Submit)
  const createDepositRequest = async (
    amount: number, 
    paymentMethod: string, 
    upiId: string, 
    utr: string
  ): Promise<{ success: boolean; message: string; depositId?: string }> => {
    if (!currentUser || !userProfile) {
      return { success: false, message: 'Please sign in to deposit funds' };
    }

    if (amount < 10 || amount > 1000) {
      return { success: false, message: 'Deposit amount must be between ₹10 and ₹1000' };
    }

    if (!utr || utr.trim().length < 6) {
      return { success: false, message: 'Please enter a valid 12-digit UTR / Transaction Reference number' };
    }

    try {
      const depositsRef = ref(db, 'deposits');
      const newDepositRef = push(depositsRef);
      const depositId = newDepositRef.key || `dep_${Date.now()}`;

      const depositData: Omit<Deposit, 'id'> = {
        userId: currentUser.uid,
        userEmail: currentUser.email || userProfile.email || '',
        userName: userProfile.displayName || currentUser.displayName || 'Player',
        amount,
        paymentMethod,
        upiId: upiId || settings.upiDetails || '',
        utr: utr.trim(),
        status: 'pending', // NEVER mark as success client-side (admin approves)
        timestamp: Date.now(),
      };

      await set(newDepositRef, depositData);

      // Add user notification
      const notifKey = `dep_req_${Date.now()}`;
      await set(ref(db, `users/${currentUser.uid}/notifications/${notifKey}`), {
        title: 'Deposit Request Received',
        message: `Your deposit request of ₹${amount.toFixed(2)} with UTR: ${utr.trim()} has been submitted. Admin will approve within 10-30 minutes.`,
        type: 'deposit',
        timestamp: Date.now(),
      });

      return { 
        success: true, 
        message: 'Deposit request submitted successfully! Funds will be credited once verified by Admin.',
        depositId 
      };
    } catch (err: any) {
      console.error("Deposit submission error:", err);
      return { success: false, message: err.message || 'Failed to submit deposit request' };
    }
  };

  // CREATE WITHDRAWAL REQUEST
  const createWithdrawalRequest = async (
    amount: number, 
    methodName: string, 
    accountInfo: string
  ): Promise<{ success: boolean; message: string }> => {
    if (!currentUser || !userProfile) {
      return { success: false, message: 'Please sign in to withdraw funds' };
    }

    const minWithdraw = Number(settings.minWithdraw) || 50;
    if (amount < minWithdraw) {
      return { success: false, message: `Minimum withdrawal amount is ₹${minWithdraw}` };
    }

    const winningCash = Number(userProfile.winningCash || 0);
    if (winningCash < amount) {
      return { success: false, message: `Insufficient Winning Cash. You have ₹${winningCash.toFixed(2)} available for withdrawal.` };
    }

    if (!accountInfo.trim()) {
      return { success: false, message: 'Please provide valid payout details (UPI ID or Bank Account)' };
    }

    const userRef = ref(db, `users/${currentUser.uid}`);
    let debited = false;

    // STEP 1: Immediately deduct winningCash via atomic transaction
    try {
      const debitResult = await runTransaction(userRef, (currentData) => {
        if (!currentData) return currentData;
        const curWin = Number(currentData.winningCash || 0);
        if (curWin < amount) return; // Abort

        return {
          ...currentData,
          winningCash: curWin - amount,
        };
      });

      if (!debitResult.committed) {
        return { success: false, message: 'Could not process withdrawal debit. Insufficient winning balance.' };
      }
      debited = true;
    } catch (debitErr: any) {
      return { success: false, message: debitErr.message || 'Transaction error during withdrawal deduction' };
    }

    // STEP 2: Create withdrawals record
    try {
      const withdrawalsRef = ref(db, 'withdrawals');
      const newWithdrawalRef = push(withdrawalsRef);

      const withdrawalData: Omit<Withdrawal, 'id'> = {
        userId: currentUser.uid,
        userName: userProfile.displayName || currentUser.displayName || 'Player',
        userEmail: currentUser.email || userProfile.email || '',
        amount,
        methodDetails: {
          methodName: methodName || (accountInfo.includes('@') ? 'UPI' : 'Bank Transfer'),
          accountInfo: accountInfo.trim(),
        },
        status: 'pending',
        requestTimestamp: Date.now(),
      };

      await set(newWithdrawalRef, withdrawalData);

      // Add in-app notification
      const notifKey = `with_req_${Date.now()}`;
      await set(ref(db, `users/${currentUser.uid}/notifications/${notifKey}`), {
        title: 'Withdrawal Request Submitted',
        message: `Your withdrawal request of ₹${amount.toFixed(2)} to ${accountInfo.trim()} is pending admin processing.`,
        type: 'withdrawal',
        timestamp: Date.now(),
      });

      return { 
        success: true, 
        message: `Withdrawal request of ₹${amount.toFixed(2)} submitted. Payout will be processed soon.` 
      };
    } catch (writeErr: any) {
      console.error("Withdrawal record write failed. Refunding winning balance...", writeErr);
      if (debited) {
        try {
          await runTransaction(userRef, (currentData) => {
            if (!currentData) return currentData;
            return {
              ...currentData,
              winningCash: (currentData.winningCash || 0) + amount,
            };
          });
        } catch (refundErr) {
          console.error("Critical: Withdrawal refund failed. Contact support.", refundErr);
        }
      }
      return { success: false, message: 'Failed to record withdrawal. Your winning balance was restored.' };
    }
  };

  return (
    <TournamentContext.Provider
      value={{
        tournaments,
        games,
        promotions,
        settings,
        deposits,
        withdrawals,
        transactions,
        leaderboard,
        notifications,
        unreadNotificationCount,
        loading,
        isTimedOut,
        selectedGameId,
        setSelectedGameId,
        statusTab,
        setStatusTab,
        joinTournament,
        createDepositRequest,
        createWithdrawalRequest,
        markNotificationsAsRead,
      }}
    >
      {children}
    </TournamentContext.Provider>
  );
};

export const useTournament = () => {
  const context = useContext(TournamentContext);
  if (!context) {
    throw new Error('useTournament must be used within a TournamentProvider');
  }
  return context;
};
