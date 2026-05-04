// CalorieNinjas only understands English. Detect German ingredient strings and
// translate them via Claude Haiku before the nutrition lookup. Used by
// /api/nutrition for both the seeder and end-user URL imports.

const GERMAN_HINTS = /[äöüÄÖÜß]|\b(EL|TL|Prise[n]?|St(ü|ue)ck|Stk|Pck|Packung|Tasse|Becher|Bund|Zehe[n]?|Zwiebel|Knoblauch|Mehl|Zucker|Butter|Eier|Sahne|Quark|klein|gro(ß|ss))\b/i;

export function isLikelyGerman(ingredients) {
  if (!Array.isArray(ingredients)) return false;
  return ingredients.some((s) => typeof s === 'string' && GERMAN_HINTS.test(s));
}

const TRANSLATE_TOOL = {
  name: 'translate',
  description: 'Return English translations of recipe ingredient lines, preserving order and length.',
  input_schema: {
    type: 'object',
    properties: {
      translations: {
        type: 'array',
        items: { type: 'string' },
        description: 'English translation of each input line, same order, same length.',
      },
    },
    required: ['translations'],
  },
};

export async function translateIngredients(ingredients, { fetchImpl = fetch, apiKey = process.env.ANTHROPIC_API_KEY } = {}) {
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY missing');
  if (!ingredients?.length) return [];

  const res = await fetchImpl('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      tools: [TRANSLATE_TOOL],
      tool_choice: { type: 'tool', name: 'translate' },
      messages: [{
        role: 'user',
        content:
          'Translate each German cooking ingredient line to English. ' +
          'Preserve quantities and units (g, ml, EL→tbsp, TL→tsp, Stück→pcs, Prise→pinch, Pck→pkg). ' +
          'Output one English translation per input line, same order.\n\n' +
          JSON.stringify(ingredients),
      }],
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Anthropic ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = await res.json();
  const toolUse = data.content?.find((b) => b.type === 'tool_use');
  const arr = toolUse?.input?.translations;
  if (!Array.isArray(arr) || arr.length !== ingredients.length) {
    throw new Error(`Translation length mismatch: got ${arr?.length}, expected ${ingredients.length}`);
  }
  return arr.map((s) => String(s).trim());
}
