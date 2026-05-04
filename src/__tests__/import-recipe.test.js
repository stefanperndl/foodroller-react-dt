import { GET } from '../app/api/import-recipe/route';

// Next.js Response is a web API not available in jsdom — minimal polyfill for tests
class FakeResponse {
  constructor(body, init = {}) {
    this.status = init.status ?? 200;
    this._body = body;
  }
  async json() { return JSON.parse(this._body); }
  static json(data, init = {}) {
    return new FakeResponse(JSON.stringify(data), init);
  }
}
global.Response = FakeResponse;

function makeRequest(url) {
  return { url: `http://localhost/api/import-recipe?url=${encodeURIComponent(url)}` };
}

const RECIPE_LD = JSON.stringify({
  '@type': 'Recipe',
  name: 'Kaiserschmarrn',
  recipeIngredient: ['200g flour', '3 eggs', '250ml milk'],
  recipeInstructions: [
    { '@type': 'HowToStep', text: 'Mix ingredients.' },
    { '@type': 'HowToStep', text: 'Fry in butter.' },
  ],
  image: 'https://example.com/img.jpg',
  recipeCategory: 'Dessert',
  recipeYield: '4',
});

const HTML_WITH_LD = `
<html><head><title>Kaiserschmarrn - Chefkoch</title>
<script type="application/ld+json">${RECIPE_LD}</script>
</head><body></body></html>
`;

const HTML_GRAPH = `
<html><head>
<script type="application/ld+json">
{"@context":"https://schema.org","@graph":[{"@type":"WebPage"},{"@type":"Recipe","name":"Pasta","recipeIngredient":["200g pasta"],"recipeInstructions":"Cook pasta.","image":"img.jpg","recipeCategory":"Pasta","recipeYield":"2"}]}
</script>
</head><body></body></html>
`;

const HTML_CHEFKOCH_STYLE = `
<html><head>
<script type="application/ld+json">
{"@type":"Recipe","name":"Gulasch","recipeIngredient":[{"base_amount":"500","amount_unit":"g","name":"Rindfleisch","suffix":"gewürfelt"},{"base_amount":"2","amount_unit":"","name":"Zwiebeln","suffix":""}],"recipeInstructions":"Cook slowly.","recipeYield":"4"}
</script>
</head><body></body></html>
`;

const HTML_NO_LD = `
<html><head>
<title>My Cake Recipe | CakeSite</title>
<meta property="og:image" content="https://example.com/cake.jpg" />
</head><body></body></html>
`;

describe('GET /api/import-recipe', () => {
  it('returns 400 when url param missing', async () => {
    const res = await GET({ url: 'http://localhost/api/import-recipe' });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/missing/i);
  });

  it('returns 400 for invalid URL', async () => {
    const res = await GET(makeRequest('not-a-url'));
    expect(res.status).toBe(400);
  });

  it('returns 400 for non-http scheme', async () => {
    const res = await GET(makeRequest('ftp://example.com'));
    expect(res.status).toBe(400);
  });

  it('returns 400 for private IP', async () => {
    const res = await GET(makeRequest('http://192.168.1.1/recipe'));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/private/i);
  });

  it('returns 400 for localhost', async () => {
    const res = await GET(makeRequest('http://localhost/recipe'));
    expect(res.status).toBe(400);
  });

  it('returns 400 for 10.x IP', async () => {
    const res = await GET(makeRequest('http://10.0.0.1/recipe'));
    expect(res.status).toBe(400);
  });

  it('returns 504 when fetch throws (timeout)', async () => {
    global.fetch = jest.fn().mockRejectedValueOnce(new Error('The operation was aborted'));
    const res = await GET(makeRequest('https://example.com/recipe'));
    expect(res.status).toBe(504);
    expect((await res.json()).error).toMatch(/could not extract/i);
  });

  it('returns 502 when upstream returns non-200', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({ ok: false, status: 403 });
    const res = await GET(makeRequest('https://example.com/recipe'));
    expect(res.status).toBe(502);
  });

  it('extracts JSON-LD recipe: maps all fields, confidence high', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({ ok: true, text: async () => HTML_WITH_LD });
    const res = await GET(makeRequest('https://example.com/recipe'));
    const body = await res.json();
    expect(body.name).toBe('Kaiserschmarrn');
    expect(body.ingredients).toEqual(['200g flour', '3 eggs', '250ml milk']);
    expect(body.instructions).toBe('Mix ingredients.\n\nFry in butter.');
    expect(body.image).toBe('https://example.com/img.jpg');
    expect(body.category).toBe('Dessert');
    expect(body.servings).toBe(4);
    expect(body.confidence).toBe('high');
  });

  it('finds Recipe inside @graph array', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({ ok: true, text: async () => HTML_GRAPH });
    const res = await GET(makeRequest('https://example.com/recipe'));
    const body = await res.json();
    expect(body.name).toBe('Pasta');
    expect(body.ingredients).toEqual(['200g pasta']);
    expect(body.confidence).toBe('high');
  });

  it('flattens chefkoch-style structured ingredient objects', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({ ok: true, text: async () => HTML_CHEFKOCH_STYLE });
    const res = await GET(makeRequest('https://www.chefkoch.at/rezepte/1'));
    const body = await res.json();
    expect(body.ingredients).toEqual(['500 g Rindfleisch gewürfelt', '2 Zwiebeln']);
  });

  it('falls back to og:image and title when no JSON-LD, confidence low', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({ ok: true, text: async () => HTML_NO_LD });
    const res = await GET(makeRequest('https://example.com/recipe'));
    const body = await res.json();
    expect(body.name).toBe('My Cake Recipe');
    expect(body.image).toBe('https://example.com/cake.jpg');
    expect(body.ingredients).toEqual([]);
    expect(body.confidence).toBe('low');
  });

  it('strips site suffix from title in fallback', async () => {
    const html = '<html><head><title>Beef Stew | AllRecipes</title></head></html>';
    global.fetch = jest.fn().mockResolvedValueOnce({ ok: true, text: async () => html });
    const res = await GET(makeRequest('https://example.com/recipe'));
    const body = await res.json();
    expect(body.name).toBe('Beef Stew');
  });
});
