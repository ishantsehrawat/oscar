import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  signInWithPopup,
  GoogleAuthProvider,
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

export async function loginWithGoogle() {
  try {
    const auth = getFirebaseAuth();
    const provider = new GoogleAuthProvider();
    // Add scopes if needed
    provider.addScope('profile');
    provider.addScope('email');
    // Set custom parameters
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    return await signInWithPopup(auth, provider);
  } catch (error: any) {
    // Provide more helpful error messages
    if (error.code === 'auth/configuration-not-found') {
      throw new Error(
        'Google Sign-In is not configured. Please enable Google Sign-In in Firebase Console under Authentication > Sign-in method.'
      );
    }
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('Sign-in popup was closed. Please try again.');
    }
    throw error;
  }
}

export async function logout() {
  const auth = getFirebaseAuth();
  return signOut(auth);
}

export function onAuthChange(callback: (user: FirebaseUser | null) => void) {
  const auth = getFirebaseAuth();
  return onAuthStateChanged(auth, callback);
}

