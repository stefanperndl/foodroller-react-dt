'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) { setLoading(false); return; }
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signInWithGoogle  = ()           => auth ? signInWithPopup(auth, googleProvider) : Promise.reject(new Error('Firebase not configured'));
  const signInWithEmail   = (e, p)       => auth ? signInWithEmailAndPassword(auth, e, p) : Promise.reject(new Error('Firebase not configured'));
  const signUpWithEmail   = (e, p)       => auth ? createUserWithEmailAndPassword(auth, e, p) : Promise.reject(new Error('Firebase not configured'));
  const signOut           = ()           => auth ? firebaseSignOut(auth) : Promise.resolve();

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
