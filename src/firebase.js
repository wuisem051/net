import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Configuración de tu proyecto Firebase real
const firebaseConfig = {
  apiKey: "AIzaSyBSU4O5ea3sWQ_xGCfWw2puZgv1ygSG5Z8",
  authDomain: "netplay-615b5.firebaseapp.com",
  projectId: "netplay-615b5",
  storageBucket: "netplay-615b5.firebasestorage.app",
  messagingSenderId: "737994530269",
  appId: "1:737994530269:web:4d31f62aebc7b68fa3ea34",
  measurementId: "G-E2B2V1G09X"
};

// Inicialización controlada
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
