import { useState, useEffect } from 'react';
import { getNutrition } from '../api/nutrition';

export function useNutrition(recipe) {
  const [nutrition, setNutrition] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!recipe?.ingredients?.length) return;
    const cacheKey = recipe.id ?? recipe.name;
    if (!cacheKey) return;
    let cancelled = false;

    setLoading(true);
    getNutrition(cacheKey, recipe.ingredients)
      .then((data) => { if (!cancelled) setNutrition(data); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [recipe?.id, recipe?.name]);

  return { nutrition, loading };
}
