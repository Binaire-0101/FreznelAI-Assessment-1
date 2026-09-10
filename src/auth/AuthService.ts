import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, type User } from 'firebase/auth';
import { firebaseAuth } from './firebase';

export class AuthService {
  signUp(email: string, password: string): Promise<User> {
    if (!firebaseAuth) return Promise.reject(new Error('Firebase is not configured. Add the VITE_FIREBASE_* variables.'));
    return createUserWithEmailAndPassword(firebaseAuth, email, password).then((credential) => credential.user);
  }

  signIn(email: string, password: string): Promise<User> {
    if (!firebaseAuth) return Promise.reject(new Error('Firebase is not configured. Add the VITE_FIREBASE_* variables.'));
    return signInWithEmailAndPassword(firebaseAuth, email, password).then((credential) => credential.user);
  }

  signOut(): Promise<void> {
    return firebaseAuth ? signOut(firebaseAuth) : Promise.resolve();
  }

  subscribe(listener: (user: User | null) => void): () => void {
    return firebaseAuth ? onAuthStateChanged(firebaseAuth, listener) : () => listener(null);
  }
}
