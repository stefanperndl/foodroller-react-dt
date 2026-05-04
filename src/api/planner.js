import { fetchRecipeByCategories } from './recipes';
import { getNutrition, getNutritionFromCache, DEFAULT_SERVINGS } from './nutrition';
import { getDatesInRange } from '../utils/utils';
import { SLOT_CATEGORIES, slotCategoryType, slotTargets } from '../utils/mealSlotRules';

const CLAUDE_ENDPOINT = '/api/claude';

async function fetchCandidates(selectedCategories, selectedRestrictions, slots, datesLength = 1, customRecipePool = []) {
  const countByType = { breakfast: 0, main: 0, snack: 0 };
  for (const slot of slots) {
    const t = slotCategoryType(slot.id);
    countByType[t] = (countByType[t] || 0) + datesLength * 2;
  }

  const seen = new Set();
  const poolByType = { breakfast: [], main: [], snack: [] };

  // Seed pool with custom recipes before fetching from TheMealDB
  for (const r of customRecipePool) {
    if (seen.has(r.name)) continue;
    const type = SLOT_CATEGORIES.breakfast.includes(r.category) ? 'breakfast'
               : SLOT_CATEGORIES.snack.includes(r.category)     ? 'snack'
               : 'main';
    seen.add(r.name);
    poolByType[type].push({ ...r, _slotType: type, _source: 'custom' });
  }

  for (const [type, needed] of Object.entries(countByType)) {
    if (!needed) continue;
    const cats =
      type === 'breakfast' ? SLOT_CATEGORIES.breakfast :
      type === 'snack'     ? SLOT_CATEGORIES.snack :
      selectedCategories.length ? selectedCategories : null;

    let attempts = 0;
    while (poolByType[type].length < needed && attempts < needed * 4) {
      attempts++;
      try {
        const r = await fetchRecipeByCategories(cats, selectedRestrictions);
        if (r && !seen.has(r.name)) {
          seen.add(r.name);
          poolByType[type].push({ ...r, _slotType: type });
        }
      } catch {}
    }
  }

  const breakfast = poolByType.breakfast;
  const main      = poolByType.main;
  const snack     = poolByType.snack;

  return {
    candidates: [...breakfast, ...main, ...snack],
    boundaries: {
      breakfast: [0,                              breakfast.length],
      main:      [breakfast.length,               breakfast.length + main.length],
      snack:     [breakfast.length + main.length, breakfast.length + main.length + snack.length],
    },
  };
}

async function enrichOne(recipe) {
  // Custom recipes store nutrition at save time — skip CalorieNinjas call
  if (recipe._source === 'custom' && recipe.nutrition) {
    const servings = recipe.servings ?? DEFAULT_SERVINGS;
    return {
      ...recipe,
      nutrition: {
        kcal:    Math.round(recipe.nutrition.kcal    / servings),
        protein: Math.round(recipe.nutrition.protein / servings),
        carbs:   Math.round(recipe.nutrition.carbs   / servings),
        fat:     Math.round(recipe.nutrition.fat     / servings),
      },
    };
  }
  const cacheKey = recipe.id ?? recipe.name;
  const cached = getNutritionFromCache(cacheKey);
  const nutrition = cached ?? await getNutrition(cacheKey, recipe.ingredients).catch(() => null);
  if (!nutrition) return null;
  return {
    ...recipe,
    nutrition: {
      kcal:    Math.round(nutrition.kcal    / DEFAULT_SERVINGS),
      protein: Math.round(nutrition.protein / DEFAULT_SERVINGS),
      carbs:   Math.round(nutrition.carbs   / DEFAULT_SERVINGS),
      fat:     Math.round(nutrition.fat     / DEFAULT_SERVINGS),
    },
  };
}

export async function enrichWithNutrition(candidates) {
  const BATCH = 3;
  const DELAY = 350;
  const results = [];
  for (let i = 0; i < candidates.length; i += BATCH) {
    const batch = await Promise.all(candidates.slice(i, i + BATCH).map(enrichOne));
    results.push(...batch);
    if (i + BATCH < candidates.length) await new Promise((r) => setTimeout(r, DELAY));
  }
  return results.filter(Boolean);
}

function buildPrompt(dates, slots, macroProfile, candidates, boundaries) {
  const section = (label, [lo, hi]) => {
    const items = candidates.slice(lo, hi);
    if (!items.length) return '';
    return `${label}:\n` + items.map((r, i) =>
      `  ${lo + i}: "${r.name}" — ${r.nutrition.kcal} kcal, ${r.nutrition.protein}g P, ${r.nutrition.carbs}g C, ${r.nutrition.fat}g F`
    ).join('\n');
  };

  const candidateList = [
    section('BREAKFAST candidates (assign ONLY to breakfast slots)', boundaries.breakfast),
    section('LUNCH/DINNER candidates (assign to lunch or dinner slots)', boundaries.main),
    section('SNACK candidates (assign ONLY to snack slots)', boundaries.snack),
  ].filter(Boolean).join('\n\n');

  const slotTargetLines = slots.map((s) => {
    const t = slotTargets(macroProfile, s.id);
    return `  - ${s.label}: ~${t.kcal} kcal, ~${t.protein}g protein`;
  }).join('\n');

  const [bLo, bHi] = boundaries.breakfast;
  const [mLo, mHi] = boundaries.main;
  const [sLo, sHi] = boundaries.snack;

  return `You are a nutrition-focused meal planner. Assign one meal per slot per day to hit the user's daily macro targets.

Daily targets (combined across ALL slots):
- Calories: ${macroProfile.kcal} kcal
- Protein:  ${macroProfile.protein}g
- Carbs:    ${macroProfile.carbs}g
- Fat:      ${macroProfile.fat}g

Per-slot targets (approximate):
${slotTargetLines}

Days to plan: ${dates.join(', ')}

${candidateList}

Rules:
- Assign exactly one meal index per slot per day.
- Each meal index used AT MOST ONCE across the ENTIRE week — no repeats.
- Breakfast-slot meals MUST come from indices ${bLo}–${bHi - 1}.
- Lunch/dinner-slot meals MUST come from indices ${mLo}–${mHi - 1}.
- Snack-slot meals MUST come from indices ${sLo}–${sHi - 1}.
- Optimize so each day's combined nutrition is as close to the daily targets as possible.

Call the assign_meals tool with your assignments.`;
}

async function callClaude(prompt, slots) {
  const slotIds = slots.map((s) => s.id);
  const slotProperties = {};
  for (const id of slotIds) {
    slotProperties[id] = { type: 'integer', description: `Meal index for the ${id} slot` };
  }

  const res = await fetch(CLAUDE_ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      tools: [{
        name: 'assign_meals',
        description: 'Assign one meal index per slot per date',
        input_schema: {
          type: 'object',
          properties: {
            assignments: {
              type: 'object',
              additionalProperties: {
                type: 'object',
                properties: slotProperties,
                required: slotIds,
              },
              description: 'Map of YYYY-MM-DD date strings to slot→meal-index objects',
            },
          },
          required: ['assignments'],
        },
      }],
      tool_choice: { type: 'tool', name: 'assign_meals' },
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) throw new Error(`Claude API error: ${res.status}`);
  const data = await res.json();
  const toolUse = data.content.find((b) => b.type === 'tool_use');
  if (!toolUse) throw new Error('AI returned an unexpected response. Please try again.');
  return toolUse.input.assignments;
}

export async function generateMealPlan({
  startDate,
  endDate,
  macroProfile,
  selectedCategories,
  selectedRestrictions,
  slots,
  onProgress,
  customRecipes = [],
}) {
  const dates = getDatesInRange(new Date(startDate), new Date(endDate))
    .map((d) => d.toISOString().slice(0, 10));

  const minNeeded = dates.length * slots.length;

  onProgress('Fetching recipe candidates…');
  const { candidates, boundaries } = await fetchCandidates(selectedCategories, selectedRestrictions, slots, dates.length, customRecipes);

  if (candidates.length < minNeeded) {
    throw new Error('Not enough recipes available. Try adjusting your category or dietary filters.');
  }

  onProgress('Calculating nutrition…');
  const enriched = await enrichWithNutrition(candidates);

  if (enriched.length < minNeeded) {
    throw new Error('Could not load nutrition data for enough recipes. Please try again.');
  }

  onProgress('Generating your plan with AI…');
  const prompt = buildPrompt(dates, slots, macroProfile, enriched, boundaries);
  const assignment = await callClaude(prompt, slots);

  const plan = {};
  for (const [date, slotMap] of Object.entries(assignment)) {
    const daySlots = {};
    for (const [slotId, idx] of Object.entries(slotMap)) {
      if (enriched[idx]) daySlots[slotId] = enriched[idx];
    }
    if (Object.keys(daySlots).length > 0) plan[date] = daySlots;
  }

  if (Object.keys(plan).length === 0) {
    throw new Error('AI returned an empty plan. Please try again.');
  }

  return plan;
}

export async function swapMeal({
  date,
  slotId,
  currentPlan,
  macroProfile,
  selectedRestrictions,
  selectedCategories,
  customRecipes = [],
}) {
  const usedIds = new Set(
    Object.values(currentPlan).flatMap((day) =>
      Object.values(day).map((m) => m?.id).filter(Boolean)
    )
  );

  const type = slotCategoryType(slotId);
  const cats =
    type === 'breakfast' ? SLOT_CATEGORIES.breakfast :
    type === 'snack'     ? SLOT_CATEGORIES.snack :
    selectedCategories?.length ? selectedCategories : null;

  // Seed candidates with matching custom recipes first
  const candidates = [];
  for (const r of customRecipes) {
    if (usedIds.has(r.id)) continue;
    const rType = SLOT_CATEGORIES.breakfast.includes(r.category) ? 'breakfast'
                : SLOT_CATEGORIES.snack.includes(r.category)     ? 'snack'
                : 'main';
    if (rType === type) candidates.push({ ...r, _source: 'custom' });
  }

  let attempts = 0;
  while (candidates.length < 8 && attempts < 40) {
    attempts++;
    try {
      const r = await fetchRecipeByCategories(cats, selectedRestrictions);
      if (r && !usedIds.has(r.id) && !candidates.find((c) => c.id === r.id)) {
        candidates.push(r);
      }
    } catch {}
  }

  if (!candidates.length) throw new Error('No suitable replacement found. Try again.');

  const enriched = (await enrichWithNutrition(candidates)).filter(Boolean);

  const dayMeals = currentPlan[date] || {};
  const otherMacros = Object.entries(dayMeals)
    .filter(([sid]) => sid !== slotId)
    .reduce(
      (acc, [, meal]) => {
        if (!meal?.nutrition) return acc;
        return {
          kcal:    acc.kcal    + meal.nutrition.kcal,
          protein: acc.protein + meal.nutrition.protein,
          carbs:   acc.carbs   + meal.nutrition.carbs,
          fat:     acc.fat     + meal.nutrition.fat,
        };
      },
      { kcal: 0, protein: 0, carbs: 0, fat: 0 }
    );

  const target = macroProfile
    ? slotTargets(macroProfile, slotId)
    : { kcal: 500, protein: 30, carbs: 50, fat: 15 };

  const scored = enriched
    .map((r) => ({
      ...r,
      score:
        Math.abs(r.nutrition.kcal    - target.kcal)    / (target.kcal    || 1) +
        Math.abs(r.nutrition.protein - target.protein) / (target.protein || 1),
    }))
    .sort((a, b) => a.score - b.score);

  if (!scored.length) throw new Error('No suitable replacement found. Try again.');

  const meal = scored[0];

  const delta = macroProfile
    ? {
        kcal:    meal.nutrition.kcal    - target.kcal,
        protein: meal.nutrition.protein - target.protein,
      }
    : null;

  return { meal, delta };
}
