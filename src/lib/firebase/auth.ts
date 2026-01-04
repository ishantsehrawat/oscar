import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";
import { getFirebaseAuth } from "./config";

export async function login(email: string, password: string) {
  const auth = getFirebaseAuth();
  return signInWithEmailAndPassword(auth, email, password);
}

export async function signup(email: string, password: string) {
  const auth = getFirebaseAuth();
  return createUserWithEmailAndPassword(auth, email, password);
}

export async function logout() {
  const auth = getFirebaseAuth();
  return signOut(auth);
}

export function onAuthChange(callback: (user: FirebaseUser | null) => void) {
  const auth = getFirebaseAuth();
  return onAuthStateChanged(auth, callback);
}

