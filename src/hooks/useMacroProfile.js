import { useState, useEffect, useRef, useCallback } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

const PROFILE_KEY = 'macro_profile_v1';

export function useMacroProfile(user) {
  const [profile, setProfileState] = useState(null);
  const prevUserRef = useRef(undefined);

  useEffect(() => {
    const wasSignedIn = prevUserRef.current != null;
    prevUserRef.current = user;

    if (user) {
      getDoc(doc(db, 'users', user.uid, 'data', 'macroProfile'))
        .then((snap) => {
          if (snap.exists()) {
            setProfileState(snap.data());
          } else {
            const local = localStorage.getItem(PROFILE_KEY);
            if (local) setProfileState(JSON.parse(local));
          }
        })
        .catch(() => {
          const local = localStorage.getItem(PROFILE_KEY);
          if (local) setProfileState(JSON.parse(local));
        });
    } else if (wasSignedIn) {
      localStorage.removeItem(PROFILE_KEY);
      setProfileState(null);
    } else {
      const local = localStorage.getItem(PROFILE_KEY);
      if (local) setProfileState(JSON.parse(local));
    }
  }, [user]);

  const setProfile = useCallback(
    (newProfile) => {
      setProfileState(newProfile);
      localStorage.setItem(PROFILE_KEY, JSON.stringify(newProfile));
      if (user) {
        setDoc(doc(db, 'users', user.uid, 'data', 'macroProfile'), newProfile).catch(
          (err) => console.error('Firestore macro profile sync error:', err)
        );
      }
    },
    [user]
  );

  return [profile, setProfile];
}
