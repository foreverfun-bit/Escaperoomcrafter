import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Public by design: this config only identifies the project - actual data
// access is gated by Firebase Auth + Firestore security rules (each
// document carries a userId, and the rules only let its owner touch it).
const firebaseConfig = {
  apiKey: 'AIzaSyD8gNdloUZ8GOV2zavXChJeQC3dNZkfJpo',
  authDomain: 'escape-room-crafter.firebaseapp.com',
  projectId: 'escape-room-crafter',
  storageBucket: 'escape-room-crafter.firebasestorage.app',
  messagingSenderId: '1049405959132',
  appId: '1:1049405959132:web:29c6caaea814dfc1fc7d19',
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
