// src/config/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyA6bQ5K5C3O4sePoJ7Umc3gyw8ll2Sagmc",
  authDomain: "biskit-point.firebaseapp.com",
  projectId: "biskit-point",
  storageBucket: "biskit-point.firebasestorage.app",
  messagingSenderId: "76332783815",
  appId: "1:76332783815:web:fb69e2f4f7be99a75b06e2",
  measurementId: "G-W19Y8L9WG6"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
