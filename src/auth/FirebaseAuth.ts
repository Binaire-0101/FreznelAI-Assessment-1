import { initializeApp } from 'firebase/app';
import { createUserWithEmailAndPassword, getAuth, signInWithEmailAndPassword, signOut, type User } from 'firebase/auth';

export class FirebaseAuth {
  private auth = getAuth(initializeApp({
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  }));

  signUp(email: string, password: string): Promise<User> {
    return createUserWithEmailAndPassword(this.auth, email, password).then((result) => result.user);
  }

  signIn(email: string, password: string): Promise<User> {
    return signInWithEmailAndPassword(this.auth, email, password).then((result) => result.user);
  }

  signOut(): Promise<void> { return signOut(this.auth); }
}
