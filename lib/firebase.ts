// firebase.ts
import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCtaW7Um6P-SNOpbgVpajXiXBSFUVkKctk",
  authDomain: "fgdfg-5ec9f.firebaseapp.com",
  projectId: "fgdfg-5ec9f",
  storageBucket: "fgdfg-5ec9f.firebasestorage.app",
  messagingSenderId: "897620683029",
  appId: "1:897620683029:web:5ecb996ef3bdac5141e11c",
  measurementId: "G-7E5B8JF8N4"
}

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const database = getDatabase(app);

export { auth, db, database };
