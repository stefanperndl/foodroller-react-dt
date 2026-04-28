import { useState, useEffect, useRef, useCallback } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

const SLOTS_KEY = 'meal_slots_v1';

export const DEFAULT_SLOTS = [
  { id: 'breakfast', label: 'Breakfast', order: 0 },
  { id: 'lunch',     label: 'Lunch',     order: 1 },
  { id: 'dinner',    label: 'Dinner',    order: 2 },
  { id: 'snack',     label: 'Snack',     order: 3 },
];

export function newSlotId() {
  return `slot-${Date.now()}`;
}

export function useMealSlots(user) {
  const [slots, setSlotsState] = useState(DEFAULT_SLOTS);
  const prevUserRef = useRef(undefined);

  useEffect(() => {
    const wasSignedIn = prevUserRef.current != null;
    prevUserRef.current = user;

    if (user) {
      getDoc(doc(db, 'users', user.uid, 'data', 'mealSlots'))
        .then((snap) => {
          if (snap.exists()) {
            setSlotsState(snap.data().slots || DEFAULT_SLOTS);
          } else {
            const local = localStorage.getItem(SLOTS_KEY);
            if (local) setSlotsState(JSON.parse(local));
          }
        })
        .catch(() => {
          const local = localStorage.getItem(SLOTS_KEY);
          if (local) setSlotsState(JSON.parse(local));
        });
    } else if (wasSignedIn) {
      localStorage.removeItem(SLOTS_KEY);
      setSlotsState(DEFAULT_SLOTS);
    } else {
      const local = localStorage.getItem(SLOTS_KEY);
      if (local) setSlotsState(JSON.parse(local));
    }
  }, [user]);

  const setSlots = useCallback((updater) => {
    setSlotsState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      localStorage.setItem(SLOTS_KEY, JSON.stringify(next));
      if (user) {
        setDoc(doc(db, 'users', user.uid, 'data', 'mealSlots'), { slots: next })
          .catch((err) => console.error('Firestore slots sync error:', err));
      }
      return next;
    });
  }, [user]);

  return [slots, setSlots];
}
