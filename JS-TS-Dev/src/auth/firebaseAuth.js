import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword
} from "firebase/auth";
import { getFirebaseAuth } from "../config/firebase.js";

export async function registerWithEmail(email, password) {
    const credential = await createUserWithEmailAndPassword(
        getFirebaseAuth(),
        email,
        password
    );

    return credential.user;
}

export async function signInWithEmail(email, password) {
    const credential = await signInWithEmailAndPassword(
        getFirebaseAuth(),
        email,
        password
    );

    return credential.user;
}

export function getAuthErrorMessage(error) {
    const messages = {
        "auth/email-already-in-use": "An account already exists for that email.",
        "auth/invalid-email": "Enter a valid email address.",
        "auth/invalid-credential": "Email or password is incorrect.",
        "auth/user-not-found": "Email or password is incorrect.",
        "auth/wrong-password": "Email or password is incorrect.",
        "auth/weak-password": "Choose a password with at least 6 characters.",
        "auth/operation-not-allowed": "Enable Email/Password sign-in in Firebase Authentication settings.",
        "auth/network-request-failed": "Could not reach Firebase. Check your internet connection."
    };

    if (error && typeof error.code === "string" && messages[error.code]) {
        return messages[error.code];
    }

    return error instanceof Error ? error.message : String(error);
}
