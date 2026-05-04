import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, addDoc, setDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { getNutrition } from '../api/nutrition';

export function useCustomRecipes(user) {
  const [recipes, setRecipes] = useState([]);

  useEffect(() => {
    if (!user) { setRecipes([]); return; }
    getDocs(collection(db, 'users', user.uid, 'recipes'))
      .then((snap) => setRecipes(snap.docs.map((d) => ({ id: d.id, ...d.data() }))))
      .catch(() => {});
  }, [user]);

  const addRecipe = useCallback(async (data) => {
    if (!user) return;
    let nutrition = null;
    if (data.ingredients?.length) {
      const cacheId = data.forkedFrom ?? null;
      nutrition = await getNutrition(cacheId, data.ingredients).catch(() => null);
    }
    const payload = { ...data, nutrition, createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
    const ref = await addDoc(collection(db, 'users', user.uid, 'recipes'), payload);
    const saved = { id: ref.id, ...data, nutrition };
    setRecipes((prev) => [...prev, saved]);
    if (nutrition && db) {
      setDoc(doc(db, 'recipes', ref.id), { nutrition }, { merge: true }).catch(() => {});
    }
    return saved;
  }, [user]);

  const updateRecipe = useCallback(async (id, data) => {
    if (!user) return;
    let nutrition = data.nutrition ?? null;
    if (data.ingredients?.length && !data.nutrition) {
      nutrition = await getNutrition(id, data.ingredients).catch(() => null);
    }
    const payload = { ...data, nutrition, updatedAt: serverTimestamp() };
    await setDoc(doc(db, 'users', user.uid, 'recipes', id), payload, { merge: true });
    setRecipes((prev) => prev.map((r) => (r.id === id ? { ...r, ...payload } : r)));
    if (nutrition && db) {
      setDoc(doc(db, 'recipes', id), { nutrition }, { merge: true }).catch(() => {});
    }
  }, [user]);

  const deleteRecipe = useCallback(async (id) => {
    if (!user) return;
    await deleteDoc(doc(db, 'users', user.uid, 'recipes', id));
    setRecipes((prev) => prev.filter((r) => r.id !== id));
  }, [user]);

  return [recipes, addRecipe, updateRecipe, deleteRecipe];
}
