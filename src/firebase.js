import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: "AIzaSyBHFCmSGYNBKxInbOwGZvPrp8X_UkQIoio",
    authDomain: "musicfestival-2fafa.firebaseapp.com",
    projectId: "musicfestival-2fafa",
    storageBucket: "musicfestival-2fafa.firebasestorage.app",
    messagingSenderId: "476039879314",
    appId: "1:476039879314:web:90cd1e1a3519177383644b",
    measurementId: "G-1EJ86T22EV"
  };

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const googleProvider = new GoogleAuthProvider();
  const db = getFirestore(app); // Firestore instance
  const storage = getStorage(app); // Storage instance
  
  export { auth, googleProvider, signInWithPopup, db, storage };