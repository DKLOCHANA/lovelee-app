// Firebase Configuration
import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCj9gw9-jqpydRj8_2zlu1IxbeuKw_juAU",
  authDomain: "lovelee-4a09f.firebaseapp.com",
  projectId: "lovelee-4a09f",
  storageBucket: "lovelee-4a09f.firebasestorage.app",
  messagingSenderId: "357789237816",
  appId: "1:357789237816:web:fc8ee9d215a382cd859ccd"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with AsyncStorage persistence
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Storage
export const storage = getStorage(app);

export default app;
