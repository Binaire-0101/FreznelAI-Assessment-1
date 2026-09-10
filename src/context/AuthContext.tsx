/**
 * AuthContext providing authentication state and operations across the app.
 * Works with real Firebase Auth and maintains persistent local auth state.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  auth,
  isFirebaseConfigured,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  firebaseSignOut,
  onAuthStateChanged,
  FirebaseUser,
} from '../firebase/firebaseConfig';
import { UserProfile } from '../types/model';

interface AuthContextType {
  currentUser: UserProfile | null;
  loading: boolean;
  error: string | null;
  isFirebaseLive: boolean;
  login: (email: string, pass: string) => Promise<void>;
  signup: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  loginAsGuest: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_USER_STORAGE_KEY = 'bf_ai_auth_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 1. If Firebase Auth is configured and active, listen to Firebase auth state
    if (auth && isFirebaseConfigured) {
      const unsubscribe = onAuthStateChanged(auth, (fbUser: FirebaseUser | null) => {
        if (fbUser) {
          setCurrentUser({
            uid: fbUser.uid,
            email: fbUser.email,
            displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'AI Engineer',
            isAnonymous: fbUser.isAnonymous,
          });
        } else {
          setCurrentUser(null);
        }
        setLoading(false);
      });
      return () => unsubscribe();
    }

    // 2. Otherwise use local persistent developer session
    try {
      const saved = localStorage.getItem(LOCAL_USER_STORAGE_KEY);
      if (saved) {
        setCurrentUser(JSON.parse(saved));
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, pass: string) => {
    setError(null);
    setLoading(true);

    try {
      if (auth && isFirebaseConfigured) {
        const cred = await signInWithEmailAndPassword(auth, email, pass);
        setCurrentUser({
          uid: cred.user.uid,
          email: cred.user.email,
          displayName: cred.user.displayName || email.split('@')[0],
        });
      } else {
        // Local developer validation
        if (!email.includes('@') || pass.length < 6) {
          throw new Error('Please enter a valid email and minimum 6-character password.');
        }
        const user: UserProfile = {
          uid: `local-${Date.now()}`,
          email,
          displayName: email.split('@')[0],
        };
        setCurrentUser(user);
        localStorage.setItem(LOCAL_USER_STORAGE_KEY, JSON.stringify(user));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed';
      setError(formatAuthError(msg));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, pass: string) => {
    setError(null);
    setLoading(true);

    try {
      if (auth && isFirebaseConfigured) {
        const cred = await createUserWithEmailAndPassword(auth, email, pass);
        setCurrentUser({
          uid: cred.user.uid,
          email: cred.user.email,
          displayName: cred.user.displayName || email.split('@')[0],
        });
      } else {
        if (!email.includes('@') || pass.length < 6) {
          throw new Error('Please enter a valid email and minimum 6-character password.');
        }
        const user: UserProfile = {
          uid: `local-${Date.now()}`,
          email,
          displayName: email.split('@')[0],
        };
        setCurrentUser(user);
        localStorage.setItem(LOCAL_USER_STORAGE_KEY, JSON.stringify(user));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      setError(formatAuthError(msg));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setError(null);
    try {
      if (auth && isFirebaseConfigured) {
        await firebaseSignOut(auth);
      }
      setCurrentUser(null);
      localStorage.removeItem(LOCAL_USER_STORAGE_KEY);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sign out error';
      setError(msg);
    }
  };

  const loginAsGuest = () => {
    const guestUser: UserProfile = {
      uid: 'guest-evaluator',
      email: 'evaluator@binaire-freznel.ai',
      displayName: 'Lead Assessor',
      isAnonymous: true,
    };
    setCurrentUser(guestUser);
    localStorage.setItem(LOCAL_USER_STORAGE_KEY, JSON.stringify(guestUser));
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        error,
        isFirebaseLive: isFirebaseConfigured,
        login,
        signup,
        logout,
        loginAsGuest,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

function formatAuthError(msg: string): string {
  if (msg.includes('user-not-found') || msg.includes('wrong-password') || msg.includes('invalid-credential')) {
    return 'Invalid email or password credentials.';
  }
  if (msg.includes('email-already-in-use')) {
    return 'An account with this email address already exists.';
  }
  if (msg.includes('network-request-failed')) {
    return 'Network failure. Please verify internet connectivity.';
  }
  return msg.replace(/Firebase: Error \(auth\//, '').replace(/\)\./, '');
}
