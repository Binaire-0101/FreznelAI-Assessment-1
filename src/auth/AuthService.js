import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { EventEmitter } from '../core/EventEmitter.js';
import { auth as firebaseAuth, isConfigured } from '../firebase.js';

/**
 * Authentication service.
 *
 * Wraps Firebase Auth behind a small, stable interface (`signUp`, `signIn`,
 * `signInWithGoogle`, `signOut`, `subscribe`) so the React layer never imports
 * the Firebase SDK directly and the whole app could be re-pointed at another
 * provider by editing this one class.
 *
 * Two behaviours are specific to this app:
 *
 *  1. **Offline sign-in.** Firebase persists the session in IndexedDB, so a
 *     previously signed-in user is restored with no network at all. A *new*
 *     sign-in genuinely needs the network, and we say so in plain language
 *     rather than surfacing `auth/network-request-failed`.
 *  2. **Demo mode.** With no Firebase project configured the service issues a
 *     local, clearly-labelled session so the rest of the app stays reviewable.
 *     `session.demo` is true in that case and the UI shows a banner.
 */

const DEMO_STORAGE_KEY = 'freznel.demo-session';

export class AuthService extends EventEmitter {
  constructor() {
    super();
    this.user = null;
    this.ready = false;
    this.demo = !isConfigured;
    this._unsubscribe = null;
  }

  /** Begin observing auth state. Returns an unsubscribe function. */
  start() {
    if (this.demo) {
      const stored = readDemoSession();
      this._apply(stored, true);
      return () => {};
    }

    this._unsubscribe = onAuthStateChanged(
      firebaseAuth,
      (user) => this._apply(user ? toSession(user) : null, true),
      (error) => {
        console.error('[AuthService] auth state error', error);
        this._apply(null, true);
      },
    );
    return this._unsubscribe;
  }

  stop() {
    if (this._unsubscribe) this._unsubscribe();
    this._unsubscribe = null;
    this.removeAllListeners();
  }

  /** @returns {Function} unsubscribe */
  subscribe(handler) {
    // Replay the current state immediately so a late subscriber is not stuck
    // waiting for the next transition.
    handler({ user: this.user, ready: this.ready, demo: this.demo });
    return this.on('change', handler);
  }

  signUp({ email, password, displayName }) {
    if (this.demo) return this._demoSignIn({ email, displayName });

    return createUserWithEmailAndPassword(firebaseAuth, email, password)
      .then((credential) => {
        if (!displayName) return credential;
        return updateProfile(credential.user, { displayName }).then(() => credential);
      })
      .then((credential) => {
        const session = toSession(credential.user, displayName);
        this._apply(session, true);
        return session;
      })
      .catch((error) => {
        throw describeAuthError(error);
      });
  }

  signIn({ email, password }) {
    if (this.demo) return this._demoSignIn({ email });

    return signInWithEmailAndPassword(firebaseAuth, email, password)
      .then((credential) => {
        const session = toSession(credential.user);
        this._apply(session, true);
        return session;
      })
      .catch((error) => {
        throw describeAuthError(error);
      });
  }

  signInWithGoogle() {
    if (this.demo) return this._demoSignIn({ email: 'demo@local', displayName: 'Demo user' });

    return signInWithPopup(firebaseAuth, new GoogleAuthProvider())
      .then((credential) => {
        const session = toSession(credential.user);
        this._apply(session, true);
        return session;
      })
      .catch((error) => {
        throw describeAuthError(error);
      });
  }

  resetPassword(email) {
    if (this.demo) return Promise.resolve(true);
    return sendPasswordResetEmail(firebaseAuth, email)
      .then(() => true)
      .catch((error) => {
        throw describeAuthError(error);
      });
  }

  signOut() {
    if (this.demo) {
      clearDemoSession();
      this._apply(null, true);
      return Promise.resolve(true);
    }
    return signOut(firebaseAuth).then(() => {
      this._apply(null, true);
      return true;
    });
  }

  _demoSignIn({ email, displayName }) {
    const session = {
      uid: `demo-${Math.random().toString(36).slice(2, 10)}`,
      email: email || 'demo@local',
      displayName: displayName || (email ? email.split('@')[0] : 'Demo user'),
      photoURL: '',
      demo: true,
    };
    writeDemoSession(session);
    this._apply(session, true);
    return Promise.resolve(session);
  }

  _apply(user, ready) {
    this.user = user;
    this.ready = ready;
    this.emit('change', { user, ready, demo: this.demo });
  }
}

function toSession(user, fallbackName) {
  return {
    uid: user.uid,
    email: user.email || '',
    displayName: user.displayName || fallbackName || (user.email ? user.email.split('@')[0] : 'Signed in'),
    photoURL: user.photoURL || '',
    demo: false,
  };
}

/** Turn Firebase error codes into sentences a person can act on. */
export function describeAuthError(error) {
  const code = error && error.code ? error.code : '';
  const messages = {
    'auth/invalid-email': 'That email address does not look right.',
    'auth/missing-password': 'Enter your password to continue.',
    'auth/weak-password': 'Passwords need to be at least 6 characters.',
    'auth/email-already-in-use': 'An account already exists for that email. Try signing in instead.',
    'auth/invalid-credential': 'Email or password is incorrect.',
    'auth/wrong-password': 'Email or password is incorrect.',
    'auth/user-not-found': 'No account found for that email.',
    'auth/too-many-requests': 'Too many attempts. Wait a moment and try again.',
    'auth/popup-closed-by-user': 'The Google sign-in window was closed before finishing.',
    'auth/network-request-failed':
      'You appear to be offline. A new sign-in needs a connection - an existing session would still work.',
    'auth/operation-not-allowed':
      'That sign-in method is disabled for this Firebase project. Enable it in Authentication > Sign-in method.',
  };

  const friendly = new Error(messages[code] || (error && error.message) || 'Authentication failed.');
  friendly.code = code;
  return friendly;
}

function readDemoSession() {
  try {
    const raw = localStorage.getItem(DEMO_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeDemoSession(session) {
  try {
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(session));
  } catch {
    /* private mode - the session simply will not survive a reload */
  }
}

function clearDemoSession() {
  try {
    localStorage.removeItem(DEMO_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
