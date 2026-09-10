import { useCallback, useEffect, useState } from 'react';
import { services } from '../services/container.js';

/**
 * React binding for `AuthService`.
 *
 * `ready` distinguishes "we do not know yet" from "definitely signed out",
 * which matters on a cold start: Firebase restores the persisted session
 * asynchronously, and rendering the sign-in screen for those few frames would
 * make every reload flash the auth screen at an already-signed-in user.
 */
export function useAuth() {
  const [state, setState] = useState(() => ({
    user: services.auth.user,
    ready: services.auth.ready,
    demo: services.auth.demo,
  }));

  useEffect(() => services.auth.subscribe(setState), []);

  const signUp = useCallback((payload) => services.auth.signUp(payload), []);
  const signIn = useCallback((payload) => services.auth.signIn(payload), []);
  const signInWithGoogle = useCallback(() => services.auth.signInWithGoogle(), []);
  const resetPassword = useCallback((email) => services.auth.resetPassword(email), []);
  const signOutUser = useCallback(() => services.auth.signOut(), []);

  return {
    user: state.user,
    ready: state.ready,
    demo: state.demo,
    signUp,
    signIn,
    signInWithGoogle,
    resetPassword,
    signOut: signOutUser,
  };
}
