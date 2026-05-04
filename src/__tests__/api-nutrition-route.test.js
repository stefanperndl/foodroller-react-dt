import { POST } from '../app/api/nutrition/route';

class FakeResponse {
  constructor(body, init = {}) {
    this.status = init.status ?? 200;
    this._body = body;
  }
  async json() { return JSON.parse(this._body); }
  static json(data, init = {}) { return new FakeResponse(JSON.stringify(data), init); }
}
global.Response = FakeResponse;

function makeRequest(body) {
  return { json: async () => body };
}

const CN_OK = {
  ok: true,
  json: async () => ({ items: [{ calories: 100, protein_g: 10, carbohydrates_total_g: 5, fat_total_g: 2, fiber_g: 1 }] }),
};

const CLAUDE_OK = (translations) => ({
  ok: true,
  json: async () => ({ content: [{ type: 'tool_use', input: { translations } }] }),
});

beforeEach(() => {
  global.fetch = jest.fn();
  process.env.CALORIE_NINJAS_API_KEY = 'cn-test';
  process.env.ANTHROPIC_API_KEY = 'ak-test';
});

afterEach(() => {
  jest.resetAllMocks();
});

describe('POST /api/nutrition', () => {
  it('passes English ingredients to CalorieNinjas without calling Anthropic', async () => {
    fetch.mockResolvedValue(CN_OK);
    const res = await POST(makeRequest({ ingredients: ['200g chicken', '1 cup rice'] }));
    expect(res.status).toBe(200);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch.mock.calls[0][0]).toContain('api.calorieninjas.com');
    expect(fetch.mock.calls[0][0]).toContain(encodeURIComponent('200g chicken, 1 cup rice'));
  });

  it('translates German ingredients via Claude before CalorieNinjas', async () => {
    fetch
      .mockResolvedValueOnce(CLAUDE_OK(['feta cheese', 'olive oil']))
      .mockResolvedValueOnce(CN_OK);
    const res = await POST(makeRequest({ ingredients: ['250 g Feta-Käse', '2 EL Olivenöl'] }));
    expect(res.status).toBe(200);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch.mock.calls[0][0]).toContain('api.anthropic.com');
    expect(fetch.mock.calls[1][0]).toContain(encodeURIComponent('feta cheese, olive oil'));
  });

  it('falls back to original ingredients when translation fails', async () => {
    fetch
      .mockResolvedValueOnce({ ok: false, status: 500, text: async () => 'oops' })
      .mockResolvedValueOnce(CN_OK);
    const res = await POST(makeRequest({ ingredients: ['250 g Feta-Käse'] }));
    expect(res.status).toBe(200);
    expect(fetch.mock.calls[1][0]).toContain(encodeURIComponent('250 g Feta-Käse'));
  });

  it('400s on invalid body', async () => {
    const res = await POST(makeRequest({ ingredients: [] }));
    expect(res.status).toBe(400);
  });
});
