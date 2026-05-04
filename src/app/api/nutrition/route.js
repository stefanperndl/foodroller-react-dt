export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');
  if (!query) return Response.json({ error: 'query required' }, { status: 400 });

  const res = await fetch(
    `https://api.calorieninjas.com/v1/nutrition?query=${encodeURIComponent(query)}`,
    { headers: { 'X-Api-Key': process.env.CALORIE_NINJAS_API_KEY } }
  );

  if (!res.ok) return Response.json({ error: `upstream error: ${res.status}` }, { status: res.status });

  const data = await res.json();
  return Response.json(data);
}
