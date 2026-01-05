// User will provide Firebase configuration
// This is a placeholder structure

import { initializeApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

// TODO: User will provide these values
const firebaseConfig = {
  apiKey: "AIzaSyCRMB1K12g0tz8c8OmCtboMdP3OUNMcz2E",
  authDomain: "oscar-51ecf.firebaseapp.com",
  projectId: "oscar-51ecf",
  storageBucket: "oscar-51ecf.firebasestorage.app",
  messagingSenderId: "1050295652702",
  appId: "1:1050295652702:web:efaa78a1ced6b8c47abfcf",
  measurementId: "G-CYNGJN8HGZ",
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

export function initFirebase(): {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
} {
  if (!app) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  }
  return { app, auth: auth!, db: db! };
}

export function getFirebaseAuth(): Auth {
  if (!auth) {
    const { auth: initializedAuth } = initFirebase();
    auth = initializedAuth;
  }
  return auth!;
}

export function getFirestoreDB(): Firestore {
  if (!db) {
    initFirebase();
  }
  return db!;
}
