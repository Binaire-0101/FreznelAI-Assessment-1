import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Default Firebase Configuration (Can be customized or replaced with environment variables)
const firebaseConfig = {
  apiKey: "AIzaSyBinaireFreznelAssessmentKey2026Mock",
  authDomain: "binaire-freznel-assessment.firebaseapp.com",
  projectId: "binaire-freznel-assessment",
  storageBucket: "binaire-freznel-assessment.appspot.com",
  messagingSenderId: "987654321012",
  appId: "1:987654321012:web:abc123def4567890"
};

// Initialize Firebase App instance safely
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
