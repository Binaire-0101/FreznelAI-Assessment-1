import { initializeApp } from 'firebase/app';
import { browserLocalPersistence, getAuth, setPersistence } from 'firebase/auth';

/**
 * Firebase bootstrap.
 *
 * Credentials come from Vite env vars (`.env.local`, see `.env.example`) rather
 * than being hard-coded, so the repository can be public without leaking a
 * project. Firebase web API keys are not secrets, but keeping them in env stops
 * forks from writing into someone else's project by accident.
 *
 * If no configuration is present the module reports `isConfigured === false`
 * instead of throwing, and `AuthService` falls back to a clearly-labelled local
 * demo session so the rest of the app can still be reviewed. Fill in the env
 * vars and that fallback disappears.
 */

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

export const isConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId,
);

let app = null;
let auth = null;

if (isConfigured) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  // Local persistence keeps the user signed in across reloads *and* across
  // offline periods, which matters because this app is expected to run with no
  // connection at all.
  setPersistence(auth, browserLocalPersistence).catch((error) => {
    console.warn('[firebase] could not enable local persistence', error);
  });
} else {
  console.warn(
    '[firebase] No VITE_FIREBASE_* environment variables found. ' +
      'Running in local demo-auth mode — copy .env.example to .env.local to enable Firebase.',
  );
}

export { app, auth, firebaseConfig };
