import { useState, useEffect, useRef, useCallback } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

const MEALPLAN_KEY = 'mealplan_v1';

// Migrate old { date: meal } → new { date: { dinner: meal } }
function migrateIfNeeded(data) {
  const result = {};
  for (const [date, value] of Object.entries(data)) {
    if (!value || typeof value !== 'object') continue;
    result[date] = ('name' in value || 'id' in value)
      ? { dinner: value }
      : value;
  }
  return result;
}

export function useMealplan(user) {
  const [mealplan, setMealplanState] = useState({});
  const [loaded, setLoaded] = useState(false);
  // undefined = initial mount, null/object = previous user value
  const prevUserRef = useRef(undefined);

  // Load from Firestore (signed in) or localStorage (anonymous)
  useEffect(() => {
    setLoaded(false);
    const wasSignedIn = prevUserRef.current != null;
    prevUserRef.current = user;

    if (user) {
      getDoc(doc(db, 'users', user.uid, 'data', 'mealplan'))
        .then((snap) => {
          if (snap.exists()) {
            const cloud = snap.data().meals || {};
            setMealplanState(migrateIfNeeded(cloud));
            localStorage.setItem(MEALPLAN_KEY, JSON.stringify(cloud));
          } else {
            // First sign-in: migrate any existing localStorage data
            const local = localStorage.getItem(MEALPLAN_KEY);
            const localData = local ? migrateIfNeeded(JSON.parse(local)) : {};
            setMealplanState(localData);
            if (Object.keys(localData).length > 0) {
              setDoc(doc(db, 'users', user.uid, 'data', 'mealplan'), { meals: localData });
            }
          }
        })
        .catch(() => {
          // Firestore unavailable — fall back to localStorage
          const stored = localStorage.getItem(MEALPLAN_KEY);
          if (stored) setMealplanState(migrateIfNeeded(JSON.parse(stored)));
        })
        .finally(() => setLoaded(true));
    } else if (wasSignedIn) {
      localStorage.removeItem(MEALPLAN_KEY);
      setMealplanState({});
      setLoaded(true);
    } else {
      const stored = localStorage.getItem(MEALPLAN_KEY);
      if (stored) setMealplanState(migrateIfNeeded(JSON.parse(stored)));
      setLoaded(true);
    }
  }, [user]);

  const setMealplan = useCallback(
    (updater) => {
      setMealplanState((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        localStorage.setItem(MEALPLAN_KEY, JSON.stringify(next));
        if (user) {
          setDoc(doc(db, 'users', user.uid, 'data', 'mealplan'), { meals: next }).catch(
            (err) => console.error('Firestore sync error:', err)
          );
        }
        return next;
      });
    },
    [user]
  );

  return [mealplan, setMealplan, loaded];
}
