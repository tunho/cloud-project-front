import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAvM1S0dBtnemZEoPPOTZcnlfgA1k3Bflg",
  authDomain: "cloud-project-backend.firebaseapp.com",
  projectId: "cloud-project-backend",
  storageBucket: "cloud-project-backend.firebasestorage.app",
  messagingSenderId: "998417534852",
  appId: "1:998417534852:web:911db85240c85caa6797d1",
  measurementId: "G-X202LM18DE"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);
