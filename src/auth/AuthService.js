import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth } from "../api/firebase";

export class AuthService {
  static async signUp(email, password) {
    return createUserWithEmailAndPassword(auth, email, password);
  }
  static async signIn(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }
  static async signOut() {
    return signOut(auth);
  }
}
