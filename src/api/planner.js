import { fetchRecipeByCategories } from './recipes';
import { getNutrition, getNutritionFromCache } from './nutrition';
import { getDatesInRange } from '../utils/utils';

// In dev the Next.js server proxies to Anthropic (avoids localhost CORS).
// In the static production build, the dangerous-client-side flag allows direct browser calls.
const CLAUDE_ENDPOINT =
  process.env.NODE_ENV === 'development'
    ? '/api/claude'
    : 'https://api.anthropic.com/v1/messages';

const DEFAULT_SERVINGS = 4;

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

async function enrichWithNutrition(candidates) {
  return Promise.all(
    candidates.map(async (recipe) => {
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
    })
  ).then((r) => r.filter(Boolean));
}

function buildPrompt(dates, macroProfile, candidates) {
  const candidateList = candidates
    .map((r, i) =>
      `${i}: "${r.name}" — ${r.nutrition.kcal} kcal, ${r.nutrition.protein}g protein, ${r.nutrition.carbs}g carbs, ${r.nutrition.fat}g fat`
    )
    .join('\n');

  return `You are a nutrition-focused meal planner. Assign one meal per day to hit the user's daily macro targets as closely as possible.

Daily targets:
- Calories: ${macroProfile.kcal} kcal
- Protein: ${macroProfile.protein}g
- Carbs: ${macroProfile.carbs}g
- Fat: ${macroProfile.fat}g

Days to plan: ${dates.join(', ')}

Available meals (index: name — nutrition per serving):
${candidateList}

Rules:
- Assign exactly one meal per day
- Use each meal index at most twice across the whole plan
- Prefer meals that best match the daily macro targets
- Respond with ONLY valid JSON: {"YYYY-MM-DD": <index>, ...}`;
}

async function callClaude(prompt) {
  const headers = { 'content-type': 'application/json' };
  if (process.env.NODE_ENV !== 'development') {
    headers['x-api-key'] = process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY;
    headers['anthropic-version'] = '2023-06-01';
    headers['anthropic-dangerous-client-side-usage-flag'] = 'true';
  }

  const res = await fetch(CLAUDE_ENDPOINT, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) throw new Error(`Claude API error: ${res.status}`);
  const data = await res.json();
  const text = data.content[0].text.trim();
  return JSON.parse(text);
}

export async function generateMealPlan({
  startDate,
  endDate,
  macroProfile,
  selectedCategories,
  selectedRestrictions,
  onProgress,
}) {
  const dates = getDatesInRange(new Date(startDate), new Date(endDate))
    .map((d) => d.toISOString().slice(0, 10));

  onProgress('Fetching recipe candidates…');
  const candidates = await fetchCandidates(dates.length * 2, selectedCategories, selectedRestrictions);

  if (candidates.length < dates.length) {
    throw new Error('Not enough recipes available. Try adjusting your category or dietary filters.');
  }

  onProgress('Calculating nutrition…');
  const enriched = await enrichWithNutrition(candidates);

  if (enriched.length < dates.length) {
    throw new Error('Could not load nutrition data for enough recipes. Please try again.');
  }

  onProgress('Generating your plan with AI…');
  const prompt = buildPrompt(dates, macroProfile, enriched);
  const assignment = await callClaude(prompt);

  // Map Claude's index assignments back to full recipe objects
  const plan = {};
  for (const [date, idx] of Object.entries(assignment)) {
    if (enriched[idx]) plan[date] = enriched[idx];
  }

  if (Object.keys(plan).length === 0) {
    throw new Error('AI returned an empty plan. Please try again.');
  }

  return plan;
}
