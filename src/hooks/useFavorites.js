import { useState, useEffect, useCallback } from 'react';
import { collection, doc, setDoc, deleteDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

export function useFavorites(user) {
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    if (!user) { setFavorites([]); return; }
    getDocs(collection(db, 'users', user.uid, 'favorites'))
      .then((snap) => setFavorites(snap.docs.map((d) => ({ id: d.id, ...d.data() }))))
      .catch(() => {});
  }, [user]);

  const addFavorite = useCallback(async (recipe) => {
    if (!user) return;
    const ref = { id: recipe.id, source: recipe.source ?? 'mealdb', name: recipe.name, image: recipe.image ?? null, category: recipe.category ?? null, savedAt: serverTimestamp() };
    await setDoc(doc(db, 'users', user.uid, 'favorites', recipe.id), ref).catch(() => {});
    setFavorites((prev) => prev.some((f) => f.id === recipe.id) ? prev : [...prev, { ...ref, savedAt: new Date() }]);
  }, [user]);

  const removeFavorite = useCallback(async (id) => {
    if (!user) return;
    await deleteDoc(doc(db, 'users', user.uid, 'favorites', id)).catch(() => {});
    setFavorites((prev) => prev.filter((f) => f.id !== id));
  }, [user]);

  const isFavorite = useCallback((id) => favorites.some((f) => f.id === id), [favorites]);

  return { favorites, addFavorite, removeFavorite, isFavorite };
}
