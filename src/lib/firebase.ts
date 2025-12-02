import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyD4I4Q0XqmuF3BZ1nwGOrrrsvz_3b9b4p0",
  authDomain: "rental-dispute-app.firebaseapp.com",
  projectId: "rental-dispute-app",
  storageBucket: "rental-dispute-app.firebasestorage.app",
  messagingSenderId: "79048702854",
  appId: "1:79048702854:web:1215214c6afd9018f5ca07"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);