import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { initializeApp } from "firebase/app";
import { inMemoryPersistence, initializeAuth } from "firebase/auth";

dotenv.config({
    path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../.env")
});

let firebaseAuth;

export function getFirebaseAuth() {
    if (firebaseAuth) return firebaseAuth;

    const config = {
        apiKey: process.env.FIREBASE_API_KEY,
        authDomain: process.env.FIREBASE_AUTH_DOMAIN,
        projectId: process.env.FIREBASE_PROJECT_ID,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.FIREBASE_APP_ID,
        measurementId: process.env.FIREBASE_MEASUREMENT_ID
    };
    const missing = Object.entries(config)
        .filter(([, value]) => !value)
        .map(([key]) => `FIREBASE_${key.replace(/[A-Z]/g, (letter) => `_${letter}`).toUpperCase()}`);

    if (missing.length) {
        throw new Error(
            `Missing Firebase settings: ${missing.join(", ")}. Copy .env.example to .env and fill in your Firebase web app configuration.`
        );
    }

    const app = initializeApp(config);
    firebaseAuth = initializeAuth(app, {
        persistence: inMemoryPersistence
    });

    return firebaseAuth;
}
