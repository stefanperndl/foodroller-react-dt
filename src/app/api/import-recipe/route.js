const PRIVATE_IP_RE = /^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|127\.|localhost)/i;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) return Response.json({ error: 'Missing url param' }, { status: 400 });

  let parsed;
  try { parsed = new URL(url); } catch {
    return Response.json({ error: 'Invalid URL' }, { status: 400 });
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return Response.json({ error: 'Only http/https URLs allowed' }, { status: 400 });
  }
  if (PRIVATE_IP_RE.test(parsed.hostname)) {
    return Response.json({ error: 'Private IPs not allowed' }, { status: 400 });
  }

  let html;
  try {
    const signal = typeof AbortSignal?.timeout === 'function'
      ? AbortSignal.timeout(3000)
      : undefined;
    const res = await fetch(url, {
      signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FoodRollerBot/1.0)' },
    });
    if (!res.ok) return Response.json({ error: `Fetch failed: ${res.status}` }, { status: 502 });
    html = await res.text();
  } catch {
    return Response.json(
      { error: 'Could not extract recipe — try copying ingredients manually' },
      { status: 504 }
    );
  }

  const ldMatches = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  let schema = null;
  for (const [, json] of ldMatches) {
    try {
      const data = JSON.parse(json.trim());
      const candidates = Array.isArray(data['@graph']) ? data['@graph'] : [data];
      schema = candidates.find((c) => c['@type'] === 'Recipe');
      if (schema) break;
    } catch {}
  }

  if (!schema) {
    const title = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]
      ?.replace(/\s*[|\-–—].*$/, '').trim() ?? '';
    const image = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1] ?? '';
    return Response.json({ name: title, image, ingredients: [], instructions: '', confidence: 'low' });
  }

  // Recursively flatten HowToStep / HowToSection trees into a list of step strings.
  function collectSteps(node) {
    if (!node) return [];
    if (typeof node === 'string') return [node];
    if (Array.isArray(node)) return node.flatMap(collectSteps);
    if (node['@type'] === 'HowToSection' || Array.isArray(node.itemListElement)) {
      return collectSteps(node.itemListElement);
    }
    if (node['@type'] === 'HowToStep' || node.text) {
      return [node.text ?? node.name ?? ''].filter(Boolean);
    }
    return [];
  }
  const instructions = collectSteps(schema.recipeInstructions).filter(Boolean).join('\n\n');

  const image = typeof schema.image === 'string'
    ? schema.image
    : (schema.image?.url ?? schema.image?.[0]?.url ?? '');

  // Handle plain strings and structured objects (e.g. chefkoch.at uses { base_amount, amount_unit, name, suffix })
  const ingredients = (schema.recipeIngredient ?? []).map((item) => {
    if (typeof item === 'string') return item;
    return [item.base_amount, item.amount_unit, item.name, item.suffix]
      .filter(Boolean).join(' ');
  });

  return Response.json({
    name: schema.name ?? '',
    ingredients,
    instructions,
    image,
    category: schema.recipeCategory ?? '',
    servings: parseInt(schema.recipeYield) || 4,
    confidence: ingredients.length > 0 ? 'high' : 'low',
  });
}
