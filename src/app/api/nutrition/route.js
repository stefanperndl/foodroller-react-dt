import { isLikelyGerman, translateIngredients } from '../../../lib/translate';

export async function POST(request) {
  let ingredients;
  try {
    ({ ingredients } = await request.json());
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  if (!Array.isArray(ingredients) || !ingredients.length) {
    return Response.json({ error: 'ingredients[] required' }, { status: 400 });
  }

  let queryList = ingredients;
  if (isLikelyGerman(ingredients)) {
    try {
      queryList = await translateIngredients(ingredients);
    } catch (err) {
      console.error('[/api/nutrition] translation failed, using original:', err.message);
    }
  }

  try {
    const query = queryList.join(', ');
    const res = await fetch(
      `https://api.calorieninjas.com/v1/nutrition?query=${encodeURIComponent(query)}`,
      { headers: { 'X-Api-Key': process.env.CALORIE_NINJAS_API_KEY } }
    );

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return Response.json({ error: `upstream ${res.status}`, detail: text }, { status: res.status });
    }

    const data = await res.json();
    return Response.json(data);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
