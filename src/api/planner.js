import { fetchRecipeByCategories } from './recipes';
import { getNutrition, getNutritionFromCache, DEFAULT_SERVINGS } from './nutrition';
import { getDatesInRange } from '../utils/utils';

const CLAUDE_ENDPOINT = '/api/claude';

async function fetchCandidates(count, selectedCategories, selectedRestrictions) {
  const results = [];
  const seen = new Set();
  let attempts = 0;

  while (results.length < count && attempts < count * 3) {
    attempts++;
    try {
      const recipe = await fetchRecipeByCategories(selectedCategories, selectedRestrictions);
      if (!seen.has(recipe.name)) {
        seen.add(recipe.name);
        results.push(recipe);
      }
    } catch {
      // skip failed fetches
    }
  }
  return results;
}

async function enrichOne(recipe) {
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
  const DELAY = 350; // ms between batches — respects CalorieNinjas rate limit
  const results = [];
  for (let i = 0; i < candidates.length; i += BATCH) {
    const batch = await Promise.all(candidates.slice(i, i + BATCH).map(enrichOne));
    results.push(...batch);
    if (i + BATCH < candidates.length) await new Promise((r) => setTimeout(r, DELAY));
  }
  return results.filter(Boolean);
}

function buildPrompt(dates, slots, macroProfile, candidates) {
  const slotLabels = slots.map((s) => `${s.id} (${s.label})`).join(', ');
  const candidateList = candidates
    .map((r, i) =>
      `${i}: "${r.name}" — ${r.nutrition.kcal} kcal, ${r.nutrition.protein}g protein, ${r.nutrition.carbs}g carbs, ${r.nutrition.fat}g fat`
    )
    .join('\n');

  return `You are a nutrition-focused meal planner. Assign one meal per slot per day so that the combined daily totals hit the user's daily macro targets as closely as possible.

Daily targets (sum across ALL slots):
- Calories: ${macroProfile.kcal} kcal
- Protein: ${macroProfile.protein}g
- Carbs: ${macroProfile.carbs}g
- Fat: ${macroProfile.fat}g

Slots per day: ${slotLabels}

Days to plan: ${dates.join(', ')}

Available meals (index: name — nutrition per serving):
${candidateList}

Rules:
- Assign exactly one meal index per slot per day
- Use each meal index at most twice across the whole plan
- The combined nutrition of all slots on a given day should be as close to the daily targets as possible
- Vary meals across days

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
}) {
  const dates = getDatesInRange(new Date(startDate), new Date(endDate))
    .map((d) => d.toISOString().slice(0, 10));

  const needed = dates.length * slots.length * 2;
  onProgress('Fetching recipe candidates…');
  const candidates = await fetchCandidates(needed, selectedCategories, selectedRestrictions);

  const minNeeded = dates.length * slots.length;
  if (candidates.length < minNeeded) {
    throw new Error('Not enough recipes available. Try adjusting your category or dietary filters.');
  }

  onProgress('Calculating nutrition…');
  const enriched = await enrichWithNutrition(candidates);

  if (enriched.length < minNeeded) {
    throw new Error('Could not load nutrition data for enough recipes. Please try again.');
  }

  onProgress('Generating your plan with AI…');
  const prompt = buildPrompt(dates, slots, macroProfile, enriched);
  const assignment = await callClaude(prompt, slots);

  // Map Claude's index assignments back to full recipe objects: { date: { slotId: meal } }
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
