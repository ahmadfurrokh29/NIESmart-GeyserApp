import { getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
// Note: For persistence in React Native, we can switch to initializeAuth with
// getReactNativePersistence(AsyncStorage). For now we use default getAuth to
// avoid type issues while keeping functionality.

// Firebase Configuration
// Replace with your actual Firebase project settings from Firebase Console > Project Settings > General
const firebaseConfig = {
  apiKey: "AIzaSyAlzxu-NAKPpQlkNo-g8U5JRW5mG1K75nU",
  authDomain: "niesmartiotgeyser.firebaseapp.com",
  databaseURL: "https://niesmartiotgeyser-default-rtdb.firebaseio.com",
  projectId: "niesmartiotgeyser",
  storageBucket: "niesmartiotgeyser.firebasestorage.app",
  messagingSenderId: "664269458990",
  appId: "1:664269458990:web:2a0bd9b25ab2e3d72359bf",
  measurementId: "G-WN3E3CY960"
};

// Initialize Firebase (support hot-reload)
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const database = getDatabase(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);

export default app;