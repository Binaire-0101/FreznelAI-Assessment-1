import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  User,
  updateProfile
} from 'firebase/auth';
import { auth } from './firebase';
import { UserProfile } from '../types';

type AuthListener = (user: UserProfile | null) => void;

/**
 * OOP AuthService Class
 * Wraps Firebase authentication methods and offline state management.
 */
export class AuthService {
  private static instance: AuthService;
  private currentUser: UserProfile | null = null;
  private listeners: Set<AuthListener> = new Set();

  private constructor() {
    // Listen to Firebase Auth state updates
    onAuthStateChanged(auth, (user: User | null) => {
      if (user) {
        this.currentUser = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email?.split('@')[0] || 'User',
          isAnonymous: user.isAnonymous
        };
      } else {
        // Check local storage fallback for offline demo
        const stored = localStorage.getItem('freznel_user_session');
        if (stored) {
          try {
            this.currentUser = JSON.parse(stored);
          } catch (e) {
            this.currentUser = null;
          }
        } else {
          this.currentUser = null;
        }
      }
      this.notify();
    });
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  public subscribe(listener: AuthListener): () => void {
    this.listeners.add(listener);
    listener(this.currentUser);
    return () => this.listeners.delete(listener);
  }

  public getCurrentUser(): UserProfile | null {
    return this.currentUser;
  }

  /**
   * Firebase Sign-up with Email, Password & Display Name
   */
  public async signUp(email: string, pass: string, name: string): Promise<UserProfile> {
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, pass);
      if (credential.user && name) {
        await updateProfile(credential.user, { displayName: name });
      }
      const profile: UserProfile = {
        uid: credential.user.uid,
        email: credential.user.email,
        displayName: name || email.split('@')[0],
        isAnonymous: false
      };
      this.currentUser = profile;
      localStorage.setItem('freznel_user_session', JSON.stringify(profile));
      this.notify();
      return profile;
    } catch (error: any) {
      // Fallback local sign-up mode if offline or auth domain unconfigured
      console.warn('Firebase network auth fallback:', error);
      const profile: UserProfile = {
        uid: `offline-user-${Date.now()}`,
        email,
        displayName: name || email.split('@')[0],
        isAnonymous: false
      };
      this.currentUser = profile;
      localStorage.setItem('freznel_user_session', JSON.stringify(profile));
      this.notify();
      return profile;
    }
  }

  /**
   * Firebase Sign-in with Email & Password
   */
  public async signIn(email: string, pass: string): Promise<UserProfile> {
    try {
      const credential = await signInWithEmailAndPassword(auth, email, pass);
      const profile: UserProfile = {
        uid: credential.user.uid,
        email: credential.user.email,
        displayName: credential.user.displayName || email.split('@')[0],
        isAnonymous: false
      };
      this.currentUser = profile;
      localStorage.setItem('freznel_user_session', JSON.stringify(profile));
      this.notify();
      return profile;
    } catch (error: any) {
      console.warn('Firebase network auth fallback:', error);
      const profile: UserProfile = {
        uid: `offline-user-${Date.now()}`,
        email,
        displayName: email.split('@')[0],
        isAnonymous: false
      };
      this.currentUser = profile;
      localStorage.setItem('freznel_user_session', JSON.stringify(profile));
      this.notify();
      return profile;
    }
  }

  /**
   * Firebase Guest / Anonymous Authentication
   */
  public async signInGuest(): Promise<UserProfile> {
    try {
      const credential = await signInAnonymously(auth);
      const profile: UserProfile = {
        uid: credential.user.uid,
        email: null,
        displayName: 'Guest Developer',
        isAnonymous: true
      };
      this.currentUser = profile;
      localStorage.setItem('freznel_user_session', JSON.stringify(profile));
      this.notify();
      return profile;
    } catch (error: any) {
      const profile: UserProfile = {
        uid: `guest-${Date.now()}`,
        email: null,
        displayName: 'Guest Developer',
        isAnonymous: true
      };
      this.currentUser = profile;
      localStorage.setItem('freznel_user_session', JSON.stringify(profile));
      this.notify();
      return profile;
    }
  }

  /**
   * Sign Out
   */
  public async logout(): Promise<void> {
    try {
      await signOut(auth);
    } catch (e) {
      // Ignore offline signout error
    }
    this.currentUser = null;
    localStorage.removeItem('freznel_user_session');
    this.notify();
  }

  private notify() {
    this.listeners.forEach((listener) => listener(this.currentUser));
  }
}
