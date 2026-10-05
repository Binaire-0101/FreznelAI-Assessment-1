import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

import { auth } from "./firebase";

export class AuthService {
  signUp(email, password) {
    return createUserWithEmailAndPassword(auth, email, password);
  }

  signIn(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  logout() {
    return signOut(auth);
  }
}
