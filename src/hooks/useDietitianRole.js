import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export function useDietitianRole(user) {
  const [isDietitian, setIsDietitian] = useState(false);

  useEffect(() => {
    if (!user) { setIsDietitian(false); return; }
    getDoc(doc(db, 'users', user.uid, 'data', 'account'))
      .then((snap) => {
        if (snap.exists() && snap.data().role === 'dietitian') setIsDietitian(true);
      })
      .catch(() => {});
  }, [user]);

  const claimDietitianRole = useCallback(async () => {
    if (!user) return;
    await setDoc(doc(db, 'users', user.uid, 'data', 'account'), { role: 'dietitian' });
    setIsDietitian(true);
  }, [user]);

  return [isDietitian, claimDietitianRole];
}
