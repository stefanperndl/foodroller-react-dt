import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

export function useStockRecipes(stockUid) {
  const [recipes, setRecipes] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!stockUid || !db) { setLoaded(true); return; }
    getDocs(collection(db, 'users', stockUid, 'recipes'))
      .then((snap) => setRecipes(snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        isStock: true,
        ownerUid: stockUid,
      }))))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [stockUid]);

  return [recipes, loaded];
}
