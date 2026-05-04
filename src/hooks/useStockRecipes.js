import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

export function useStockRecipes(stockUid) {
  const [recipes, setRecipes] = useState([]);

  useEffect(() => {
    if (!stockUid || !db) return;
    getDocs(collection(db, 'users', stockUid, 'recipes'))
      .then((snap) => setRecipes(snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        isStock: true,
        ownerUid: stockUid,
      }))))
      .catch(() => {});
  }, [stockUid]);

  return [recipes];
}
