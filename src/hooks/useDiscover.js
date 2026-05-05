import { useState, useMemo } from 'react';

function scoreMacroFit(recipe, macroProfile) {
  if (!macroProfile || !recipe.nutrition) return 0.5; // stable fallback
  const target = { kcal: macroProfile.kcal / 3, protein: macroProfile.protein / 3, carbs: macroProfile.carbs / 3, fat: macroProfile.fat / 3 };
  const n = recipe.nutrition;
  const relErr = (
    Math.abs((n.kcal ?? 0) - target.kcal) / Math.max(target.kcal, 1) +
    Math.abs((n.protein ?? 0) - target.protein) / Math.max(target.protein, 1) +
    Math.abs((n.carbs ?? 0) - target.carbs) / Math.max(target.carbs, 1) +
    Math.abs((n.fat ?? 0) - target.fat) / Math.max(target.fat, 1)
  ) / 4;
  return Math.max(0, 1 - Math.min(relErr, 1));
}

export function useDiscover(allRecipes, macroProfile) {
  const [seen, setSeen] = useState(() => new Set());

  const ranked = useMemo(() => {
    if (!allRecipes?.length) return [];
    return [...allRecipes]
      .map((r) => ({ recipe: r, score: scoreMacroFit(r, macroProfile) }))
      .sort((a, b) => b.score - a.score)
      .map((x) => x.recipe);
  }, [allRecipes, macroProfile]);

  const queue = ranked.filter((r) => !seen.has(r.id));

  function dismiss(id) { setSeen((prev) => new Set([...prev, id])); }
  function like(id) { setSeen((prev) => new Set([...prev, id])); }

  return { queue, loading: false, dismiss, like };
}
