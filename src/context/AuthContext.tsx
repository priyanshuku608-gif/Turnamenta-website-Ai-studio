import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut, 
  User, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { ref, onValue, set, get, update, serverTimestamp } from 'firebase/database';
import { auth, googleProvider, db } from '../lib/firebase';
import { UserProfile, AppSettings } from '../types';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAuthModalOpen: boolean;
  openAuthModal: (onSuccessCallback?: () => void) => void;
  closeAuthModal: () => void;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, displayName: string) => Promise<void>;
  signInWithDemoAccount: (email?: string, name?: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  submitReferralCode: (code: string) => Promise<{ success: boolean; message: string }>;
  skipReferralPrompt: () => Promise<void>;
  updateUserGameCredentials: (username: string, gameUid: string) => Promise<void>;
  updateDisplayName: (newName: string) => Promise<void>;
  pendingAction: (() => void) | null;
  showReferralPrompt: boolean;
  setShowReferralPrompt: (show: boolean) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [showReferralPrompt, setShowReferralPrompt] = useState(false);

  // Helper to generate unique referral code
  const generateReferralCode = (name: string, uid: string) => {
    const cleanName = (name || 'USER').replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase();
    const shortUid = uid.slice(0, 4).toUpperCase();
    return `${cleanName}${shortUid}`;
  };

  // Listen to Auth state
  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Listen to live user profile from Realtime Database
        const userRef = ref(db, `users/${user.uid}`);
        unsubscribeProfile = onValue(userRef, async (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val() as UserProfile;
            setUserProfile({ ...data, uid: user.uid });
            // Check if referral prompt is complete
            if (!data.referralPromptComplete && !data.referredBy) {
              setShowReferralPrompt(true);
            }
          } else {
            // Fetch signup bonus from settings if present
            let signupBonus = 0;
            try {
              const settingsSnap = await get(ref(db, 'settings'));
              if (settingsSnap.exists()) {
                const settings = settingsSnap.val() as AppSettings;
                signupBonus = Number(settings.signupBonus) || 0;
              }
            } catch (err) {
              console.warn("Could not fetch settings for signup bonus", err);
            }

            // Create initial user profile
            const refCode = generateReferralCode(user.displayName || 'PLAYER', user.uid);
            const initialProfile: UserProfile = {
              uid: user.uid,
              displayName: user.displayName || 'Player',
              email: user.email || '',
              photoURL: user.photoURL || '',
              depositBalance: 0,
              winningCash: 0,
              bonusCash: signupBonus,
              totalMatches: 0,
              wonMatches: 0,
              totalEarnings: 0,
              referralEarnings: 0,
              referralCode: refCode,
              referralPromptComplete: false,
              isAdmin: false,
              createdAt: Date.now(),
              lastLogin: Date.now(),
            };

            await set(userRef, initialProfile);
            setUserProfile(initialProfile);
            setShowReferralPrompt(true);
          }
          setLoading(false);
        }, (error) => {
          console.error("Error fetching user profile:", error);
          setLoading(false);
        });
      } else {
        if (unsubscribeProfile) {
          unsubscribeProfile();
        }
        setUserProfile(null);
        setShowReferralPrompt(false);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
    };
  }, []);

  const openAuthModal = useCallback((onSuccessCallback?: () => void) => {
    if (onSuccessCallback) {
      setPendingAction(() => onSuccessCallback);
    }
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      setIsAuthModalOpen(false);
      if (pendingAction) {
        const action = pendingAction;
        setPendingAction(null);
        setTimeout(() => action(), 100);
      }
      return;
    } catch (error: any) {
      console.error("Google sign in error:", error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email.trim(), pass);
      setIsAuthModalOpen(false);
      if (pendingAction) {
        const action = pendingAction;
        setPendingAction(null);
        setTimeout(() => action(), 100);
      }
    } catch (err: any) {
      console.error("Email sign-in failed:", err);
      throw err;
    }
  };

  const signUpWithEmail = async (email: string, pass: string, displayName: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      if (displayName.trim()) {
        await updateProfile(userCredential.user, { displayName: displayName.trim() });
      }
      setIsAuthModalOpen(false);
      if (pendingAction) {
        const action = pendingAction;
        setPendingAction(null);
        setTimeout(() => action(), 100);
      }
    } catch (err: any) {
      console.error("Email sign-up failed:", err);
      throw err;
    }
  };

  // Demo sign-in fallback for environments/previews where popup might be blocked
  const signInWithDemoAccount = async (email = "player@battlepro.app", name = "BattlePro Player") => {
    try {
      let userCredential;
      try {
        userCredential = await signInWithEmailAndPassword(auth, email, "battlepro123");
      } catch (loginErr: any) {
        if (loginErr.code === 'auth/user-not-found' || loginErr.code === 'auth/invalid-credential') {
          userCredential = await createUserWithEmailAndPassword(auth, email, "battlepro123");
          await updateProfile(userCredential.user, { displayName: name });
        } else {
          throw loginErr;
        }
      }
      setIsAuthModalOpen(false);
      if (pendingAction) {
        const action = pendingAction;
        setPendingAction(null);
        setTimeout(() => action(), 100);
      }
    } catch (err) {
      console.error("Demo account sign in failed:", err);
      throw err;
    }
  };

  const signOutUser = async () => {
    await signOut(auth);
    setUserProfile(null);
    setPendingAction(null);
  };

  const submitReferralCode = async (code: string): Promise<{ success: boolean; message: string }> => {
    if (!currentUser || !code.trim()) {
      return { success: false, message: 'Invalid code or not signed in' };
    }

    const cleanCode = code.trim().toUpperCase();

    if (userProfile?.referralCode === cleanCode) {
      return { success: false, message: 'You cannot use your own referral code' };
    }

    try {
      // Find referrer with this code
      const usersSnap = await get(ref(db, 'users'));
      let referrerUid: string | null = null;
      let referrerData: UserProfile | null = null;

      if (usersSnap.exists()) {
        const allUsers = usersSnap.val();
        for (const [uid, uData] of Object.entries(allUsers) as [string, any][]) {
          if (uData.referralCode === cleanCode) {
            referrerUid = uid;
            referrerData = uData;
            break;
          }
        }
      }

      if (!referrerUid || !referrerData) {
        return { success: false, message: 'Referral code not found' };
      }

      // Record in pending referrals
      const pendingRef = ref(db, `pendingReferrals/${currentUser.uid}_${referrerUid}`);
      await set(pendingRef, {
        referrerUid,
        referrerEmail: referrerData.email || '',
        referredUid: currentUser.uid,
        referredEmail: currentUser.email || '',
        referralCode: cleanCode,
        status: 'pending',
        timestamp: Date.now(),
      });

      // Update current user
      await update(ref(db, `users/${currentUser.uid}`), {
        referredBy: cleanCode,
        referralPromptComplete: true,
      });

      setShowReferralPrompt(false);
      return { success: true, message: 'Referral code applied successfully!' };
    } catch (err: any) {
      console.error("Referral submit error:", err);
      return { success: false, message: err.message || 'Failed to apply referral code' };
    }
  };

  const skipReferralPrompt = async () => {
    if (currentUser) {
      await update(ref(db, `users/${currentUser.uid}`), {
        referralPromptComplete: true,
      });
    }
    setShowReferralPrompt(false);
  };

  const updateUserGameCredentials = async (username: string, gameUid: string) => {
    if (!currentUser) return;
    await update(ref(db, `users/${currentUser.uid}`), {
      username,
      gameUid,
    });
  };

  const updateDisplayName = async (newName: string) => {
    if (!currentUser) return;
    await update(ref(db, `users/${currentUser.uid}`), {
      displayName: newName,
    });
    if (auth.currentUser) {
      await updateProfile(auth.currentUser, { displayName: newName });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signInWithDemoAccount,
        signOutUser,
        submitReferralCode,
        skipReferralPrompt,
        updateUserGameCredentials,
        updateDisplayName,
        pendingAction,
        showReferralPrompt,
        setShowReferralPrompt,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
