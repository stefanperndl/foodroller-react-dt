import { db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export const DEFAULT_SERVINGS = 4;
export const MIN_KCAL_TOTAL = 100;

const CACHE_PREFIX = 'nutrition_v1_';

async function fetchFromAPI(ingredients) {
  const res = await fetch('/api/nutrition', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ingredients }),
  });
  if (!res.ok) throw new Error(`CalorieNinjas error: ${res.status}`);
  const data = await res.json();

  return data.items.reduce(
    (acc, item) => ({
      kcal:    acc.kcal    + item.calories,
      protein: acc.protein + item.protein_g,
      carbs:   acc.carbs   + item.carbohydrates_total_g,
      fat:     acc.fat     + item.fat_total_g,
      fiber:   acc.fiber   + item.fiber_g,
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
  );
}

export function getNutritionFromCache(recipeId) {
  if (!recipeId || typeof window === 'undefined') return null;
  const cached = localStorage.getItem(`${CACHE_PREFIX}${recipeId}`);
  return cached ? JSON.parse(cached) : null;
}

export async function getNutrition(recipeId, ingredients) {
  if (!ingredients?.length) return null;

  const lsKey = `${CACHE_PREFIX}${recipeId}`;
  const lsCached = localStorage.getItem(lsKey);
  if (lsCached) return JSON.parse(lsCached);

  if (db && recipeId) {
    try {
      const snap = await getDoc(doc(db, 'recipes', String(recipeId)));
      if (snap.exists() && snap.data().nutrition) {
        const data = snap.data().nutrition;
        localStorage.setItem(lsKey, JSON.stringify(data));
        return data;
      }
    } catch {
      // Firestore unavailable (e.g. permission denied before rules updated) — fall through to API
    }
  }

  const nutrition = await fetchFromAPI(ingredients);
  localStorage.setItem(lsKey, JSON.stringify(nutrition));
  if (db && recipeId) {
    setDoc(doc(db, 'recipes', String(recipeId)), { nutrition }, { merge: true })
      .catch(() => {});
  }
  return nutrition;
}
