import React, { useState } from 'react';
import { X, ShieldCheck, Gamepad2, AlertCircle, Sparkles, Copy, Check, ExternalLink, Mail, Lock, User, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AuthModal: React.FC = () => {
  const { 
    isAuthModalOpen, 
    closeAuthModal, 
    signInWithGoogle, 
    signInWithEmail,
    signUpWithEmail,
    signInWithDemoAccount 
  } = useAuth();

  const [authMode, setAuthMode] = useState<'google' | 'email-signin' | 'email-signup'>('google');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isUnauthorizedDomain, setIsUnauthorizedDomain] = useState(false);
  const [copiedDomain, setCopiedDomain] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  if (!isAuthModalOpen) return null;

  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : '';

  const handleCopyDomain = () => {
    if (currentHostname) {
      navigator.clipboard.writeText(currentHostname);
      setCopiedDomain(true);
      setTimeout(() => setCopiedDomain(false), 2000);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg(null);
    setIsUnauthorizedDomain(false);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      if (err.code === 'auth/unauthorized-domain' || (err.message && err.message.includes('auth/unauthorized-domain'))) {
        setIsUnauthorizedDomain(true);
        setErrorMsg('This preview domain is not yet added to Firebase Authorized Domains.');
      } else if (err.code === 'auth/popup-closed-by-user') {
        setErrorMsg('Sign-in cancelled. Please try again.');
      } else if (err.code === 'auth/popup-blocked') {
        setErrorMsg('Popup was blocked by your browser. Please allow popups or use Email / Quick Access.');
      } else if (err.code === 'auth/network-request-failed') {
        setErrorMsg('Network error. Please check your internet connection.');
      } else {
        setErrorMsg(err.message || 'Failed to sign in with Google');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please enter both email and password.');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      await signInWithEmail(email, password);
    } catch (err: any) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setErrorMsg('Invalid email or password.');
      } else if (err.code === 'auth/invalid-email') {
        setErrorMsg('Please enter a valid email address.');
      } else {
        setErrorMsg(err.message || 'Sign in failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim() || !displayName.trim()) {
      setErrorMsg('Please complete all fields.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      await signUpWithEmail(email, password, displayName);
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setErrorMsg('An account with this email already exists. Please Sign In.');
      } else if (err.code === 'auth/invalid-email') {
        setErrorMsg('Please enter a valid email address.');
      } else if (err.code === 'auth/weak-password') {
        setErrorMsg('Password is too weak. Use at least 6 characters.');
      } else {
        setErrorMsg(err.message || 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSignIn = async (name = "Player Pro") => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const demoEmail = `player_${Math.floor(1000 + Math.random() * 9000)}@battlepro.app`;
      await signInWithDemoAccount(demoEmail, name);
    } catch (err: any) {
      setErrorMsg(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-sm bg-[#1E293B] border border-slate-700/80 rounded-2xl p-5 sm:p-6 shadow-2xl text-slate-100 my-auto">
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="text-center mb-4">
          <div className="w-12 h-12 mx-auto mb-2 rounded-2xl bg-gradient-to-tr from-[#0F172A] to-[#1E293B] border-2 border-[#B6FF3C] flex items-center justify-center shadow-[0_0_15px_rgba(182,255,60,0.3)]">
            <Gamepad2 className="w-6 h-6 text-[#B6FF3C]" />
          </div>
          <h2 className="text-lg font-extrabold text-white tracking-wide">
            {authMode === 'email-signup' ? 'Create BattlePro Account' : 'Sign In to BattlePro'}
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Join tournaments, track earnings, and withdraw winnings instantly.
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#0F172A] rounded-xl border border-slate-800 mb-4">
          <button
            type="button"
            onClick={() => {
              setAuthMode('google');
              setErrorMsg(null);
            }}
            className={`py-1.5 text-xs font-bold rounded-lg transition ${
              authMode === 'google' || authMode === 'email-signin'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('email-signup');
              setErrorMsg(null);
            }}
            className={`py-1.5 text-xs font-bold rounded-lg transition ${
              authMode === 'email-signup'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Register
          </button>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="mb-3 p-3 bg-red-950/70 border border-red-500/40 rounded-xl flex items-start gap-2 text-red-200 text-xs">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span className="leading-tight">{errorMsg}</span>
          </div>
        )}

        {/* Unauthorized Domain Helper Card */}
        {isUnauthorizedDomain && (
          <div className="mb-4 p-3 bg-amber-950/60 border border-amber-500/40 rounded-xl space-y-2.5 text-amber-200 text-xs">
            <div className="font-bold flex items-center gap-1.5 text-amber-300">
              <span>Firebase Authorized Domains Setup</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-300">
              To enable Google Sign-In on this preview URL, add this domain in your Firebase Console under{' '}
              <strong className="text-white">Authentication &gt; Settings &gt; Authorized domains</strong>:
            </p>
            <div className="flex items-center justify-between bg-[#0F172A] p-2 rounded-lg border border-slate-700">
              <span className="font-mono text-[11px] text-white truncate max-w-[200px]">
                {currentHostname}
              </span>
              <button
                type="button"
                onClick={handleCopyDomain}
                className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold rounded flex items-center gap-1 shrink-0 transition"
              >
                {copiedDomain ? <Check className="w-3 h-3 text-white" /> : <Copy className="w-3 h-3" />}
                <span>{copiedDomain ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <p className="text-[10px] text-amber-300/90 font-medium">
              💡 You can also sign in right now using Email & Password or Quick Player Sign-In below without configuring domains!
            </p>
          </div>
        )}

        {/* TAB 1: Main Sign In (Google + Email Form Switch) */}
        {(authMode === 'google' || authMode === 'email-signin') && (
          <div className="space-y-3">
            {/* Google Sign In Button */}
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-900 font-semibold rounded-xl flex items-center justify-center gap-3 transition active:scale-98 shadow-md disabled:opacity-50 text-xs sm:text-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{loading ? 'Connecting...' : 'Continue with Google'}</span>
            </button>

            {/* Divider */}
            <div className="flex items-center gap-2 my-2">
              <div className="flex-1 border-t border-slate-700" />
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Or Email</span>
              <div className="flex-1 border-t border-slate-700" />
            </div>

            {/* Email / Password Sign In Form */}
            <form onSubmit={handleEmailSignIn} className="space-y-2.5">
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-[#0F172A] border border-slate-700 focus:border-[#B6FF3C] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 outline-none transition"
                />
              </div>

              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-[#0F172A] border border-slate-700 focus:border-[#B6FF3C] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 outline-none transition"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition active:scale-98 shadow-md disabled:opacity-50"
              >
                <span>{loading ? 'Signing In...' : 'Sign In with Email'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>

            {/* Quick Demo Access button */}
            <button
              type="button"
              onClick={() => handleDemoSignIn()}
              disabled={loading}
              className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white font-medium text-xs rounded-xl flex items-center justify-center gap-1.5 transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#B6FF3C]" />
              <span>1-Click Quick Player Sign-In</span>
            </button>
          </div>
        )}

        {/* TAB 2: Register with Email */}
        {authMode === 'email-signup' && (
          <form onSubmit={handleEmailSignUp} className="space-y-3">
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Gamer / Display Name (e.g. ShadowHunter)"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                maxLength={24}
                className="w-full bg-[#0F172A] border border-slate-700 focus:border-[#B6FF3C] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 outline-none transition"
              />
            </div>

            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-[#0F172A] border border-slate-700 focus:border-[#B6FF3C] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 outline-none transition"
              />
            </div>

            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                placeholder="Create Password (min 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full bg-[#0F172A] border border-slate-700 focus:border-[#B6FF3C] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 outline-none transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#B6FF3C] hover:bg-[#a5e834] text-black font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition active:scale-98 shadow-md disabled:opacity-50"
            >
              <span>{loading ? 'Creating Account...' : 'Create Account & Claim Bonus'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {/* Quick Demo Access */}
            <button
              type="button"
              onClick={() => handleDemoSignIn()}
              disabled={loading}
              className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white font-medium text-xs rounded-xl flex items-center justify-center gap-1.5 transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#B6FF3C]" />
              <span>Or 1-Click Quick Player Sign-In</span>
            </button>
          </form>
        )}

        {/* Trust Badges */}
        <div className="mt-4 pt-3 border-t border-slate-700/50 flex items-center justify-center gap-3 text-[11px] text-slate-400">
          <div className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#B6FF3C]" />
            <span>100% Secure</span>
          </div>
          <span>•</span>
          <span>Instant UPI Payouts</span>
        </div>
      </div>
    </div>
  );
};
