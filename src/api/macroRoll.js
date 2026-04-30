import { fetchRecipeByCategories } from './recipes';
import { getNutritionFromCache, DEFAULT_SERVINGS } from './nutrition';
import { enrichWithNutrition } from './planner';

const CANDIDATE_TARGET = 10;
const CANDIDATE_MAX_ATTEMPTS = 30;
const FIT_WEIGHTS = { protein: 0.40, kcal: 0.30, carbs: 0.20, fat: 0.10 };

export function computeRemainingMacros(date, excludeSlotId, mealplan, nutritionMap, macroProfile) {
  const dayMeals = mealplan[date] ?? {};
  const sum = { kcal: 0, protein: 0, carbs: 0, fat: 0 };

  for (const [slotId, meal] of Object.entries(dayMeals)) {
    if (slotId === excludeSlotId || !meal) continue;
    const key = meal.id ?? meal.name;
    const raw = key ? (getNutritionFromCache(key) ?? nutritionMap?.[key]) : null;
    if (!raw) continue;
    sum.kcal    += raw.kcal    / DEFAULT_SERVINGS;
    sum.protein += raw.protein / DEFAULT_SERVINGS;
    sum.carbs   += raw.carbs   / DEFAULT_SERVINGS;
    sum.fat     += raw.fat     / DEFAULT_SERVINGS;
  }

  return {
    kcal:    Math.max(macroProfile.kcal    - sum.kcal,    0),
    protein: Math.max(macroProfile.protein - sum.protein, 0),
    carbs:   Math.max(macroProfile.carbs   - sum.carbs,   0),
    fat:     Math.max(macroProfile.fat     - sum.fat,     0),
  };
}

export function pickBestFit(candidates, remaining) {
  const score = (c) =>
    Object.keys(FIT_WEIGHTS).reduce((s, m) => {
      const denom = Math.max(remaining[m], 1);
      return s + FIT_WEIGHTS[m] * Math.min(c.nutrition[m] / denom, 1);
    }, 0);

  return candidates.reduce((best, c) => (score(c) > score(best) ? c : best));
}

async function fetchCandidates(categories, restrictions) {
  const results = [];
  const seen = new Set();
  let attempts = 0;
  while (results.length < CANDIDATE_TARGET && attempts < CANDIDATE_MAX_ATTEMPTS) {
    attempts++;
    try {
      const recipe = await fetchRecipeByCategories(categories, restrictions);
      if (!seen.has(recipe.id ?? recipe.name)) {
        seen.add(recipe.id ?? recipe.name);
        results.push(recipe);
      }
    } catch {
      // skip failed fetches
    }
  }
  return results;
}

export async function macroAwareRoll({
  date, slotId, mealplan, nutritionMap, macroProfile, categories, restrictions,
}) {
  if (!macroProfile) return null;

  const candidates = await fetchCandidates(categories, restrictions);
  const enriched = await enrichWithNutrition(candidates);
  if (!enriched.length) return null;

  const remaining = computeRemainingMacros(date, slotId, mealplan, nutritionMap, macroProfile);
  return pickBestFit(enriched, remaining);
}
