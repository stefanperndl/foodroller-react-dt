import { useState, useEffect, useRef, useCallback } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

const KEY = 'onboarding_v1';

export function useOnboarding(user) {
  const [status, setStatus] = useState(() => {
    try {
      const stored = localStorage.getItem(KEY);
      if (stored && JSON.parse(stored).dismissed) return 'dismissed';
    } catch {}
    return 'pending';
  });
  const prevUidRef = useRef(null);

  useEffect(() => {
    if (!user) {
      prevUidRef.current = null;
      return;
    }
    if (user.uid === prevUidRef.current) return;
    prevUidRef.current = user.uid;

    getDoc(doc(db, 'users', user.uid, 'data', 'onboarding'))
      .then((snap) => {
        if (snap.exists() && snap.data().dismissed) {
          localStorage.setItem(KEY, JSON.stringify(snap.data()));
          setStatus('dismissed');
        } else if (!snap.exists()) {
          try {
            const local = localStorage.getItem(KEY);
            if (local) {
              const parsed = JSON.parse(local);
              if (parsed.dismissed) {
                setDoc(doc(db, 'users', user.uid, 'data', 'onboarding'), parsed).catch(() => {});
              }
            }
          } catch {}
        }
      })
      .catch(() => {});
  }, [user]);

  const completeOnboarding = useCallback(({ completedSteps = 0 } = {}) => {
    const payload = {
      dismissed: true,
      completedAt: new Date().toISOString(),
      completedSteps,
    };
    try { localStorage.setItem(KEY, JSON.stringify(payload)); } catch {}
    setStatus('dismissed');
    if (user) {
      setDoc(doc(db, 'users', user.uid, 'data', 'onboarding'), payload).catch(() => {});
    }
  }, [user]);

  return { showOnboarding: status === 'pending', completeOnboarding };
}
