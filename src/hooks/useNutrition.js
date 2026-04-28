import { useState, useEffect } from 'react';
import { getNutrition } from '../api/nutrition';

export function useNutrition(recipe) {
  const [nutrition, setNutrition] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!recipe?.id || !recipe?.ingredients?.length) return;
    let cancelled = false;

    setLoading(true);
    getNutrition(recipe.id, recipe.ingredients)
      .then((data) => { if (!cancelled) setNutrition(data); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [recipe?.id]);

  return { nutrition, loading };
}
