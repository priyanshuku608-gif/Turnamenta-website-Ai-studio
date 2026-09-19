import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getDatabase } from "firebase/database";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

export const firebaseConfig = {
  apiKey: "AIzaSyBvhXAM0o7ALpvEVqOMJpNB736GxfStQIo",
  authDomain: "battle-prooo1.firebaseapp.com",
  projectId: "battle-prooo1",
  storageBucket: "battle-prooo1.firebasestorage.app",
  messagingSenderId: "874018169702",
  appId: "1:874018169702:web:a7fa31f633542e26c8dea7",
  measurementId: "G-Y53GRV6SDQ"
};

// Initialize Firebase App
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Realtime Database instance
export const db = getDatabase(app);

// Authentication
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Analytics (safely check browser support)
export let analytics: ReturnType<typeof getAnalytics> | null = null;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      try {
        analytics = getAnalytics(app);
      } catch (err) {
        console.warn("Analytics initialization failed:", err);
      }
    }
  }).catch(() => {
    // Ignore analytics error in sandboxed environments
  });
}
