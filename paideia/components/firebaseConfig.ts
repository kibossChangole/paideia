import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database'; // For Realtime Database
import { getFirestore } from 'firebase/firestore'; // For Firestore
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyCr1TKf5ZR8g1hy7_nEeHP6iGcqGGwQ_m4",
    authDomain: "paideia-51b55.firebaseapp.com",
    databaseURL: "https://paideia-51b55-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "paideia-51b55",
    storageBucket: "paideia-51b55.firebasestorage.app",
    messagingSenderId: "809416017452",
    appId: "1:809416017452:web:c4cb27b715f1e96a7d7389",
    measurementId: "G-RP2ETENRY3"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app); // Realtime Database
const firestore = getFirestore(app); // Firestore

export { database, firestore };
