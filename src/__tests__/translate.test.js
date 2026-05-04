import { isLikelyGerman, translateIngredients } from '../lib/translate';

describe('isLikelyGerman', () => {
  it('detects umlauts', () => {
    expect(isLikelyGerman(['250 g Feta-Käse'])).toBe(true);
    expect(isLikelyGerman(['1 Stück Brot'])).toBe(true);
  });

  it('detects German units', () => {
    expect(isLikelyGerman(['2 EL Olivenöl'])).toBe(true);
    expect(isLikelyGerman(['1 TL Salz'])).toBe(true);
    expect(isLikelyGerman(['1 Prise Pfeffer'])).toBe(true);
    expect(isLikelyGerman(['1 Bund Petersilie'])).toBe(true);
  });

  it('returns false for English ingredients', () => {
    expect(isLikelyGerman(['200g chicken', '1 cup rice', '2 tbsp olive oil'])).toBe(false);
  });

  it('handles empty / invalid input', () => {
    expect(isLikelyGerman([])).toBe(false);
    expect(isLikelyGerman(null)).toBe(false);
    expect(isLikelyGerman(undefined)).toBe(false);
  });
});

describe('translateIngredients', () => {
  const okResponse = (translations) => ({
    ok: true,
    json: async () => ({ content: [{ type: 'tool_use', input: { translations } }] }),
  });

  it('returns translated array', async () => {
    const fetchImpl = jest.fn().mockResolvedValue(okResponse(['feta cheese', 'olive oil']));
    const result = await translateIngredients(['Feta-Käse', 'Olivenöl'], { fetchImpl, apiKey: 'test' });
    expect(result).toEqual(['feta cheese', 'olive oil']);
  });

  it('throws on length mismatch', async () => {
    const fetchImpl = jest.fn().mockResolvedValue(okResponse(['only one']));
    await expect(translateIngredients(['a', 'b'], { fetchImpl, apiKey: 'test' }))
      .rejects.toThrow(/length mismatch/);
  });

  it('throws on missing API key', async () => {
    await expect(translateIngredients(['a'], { fetchImpl: jest.fn(), apiKey: '' }))
      .rejects.toThrow(/ANTHROPIC_API_KEY missing/);
  });

  it('returns empty array for empty input', async () => {
    const result = await translateIngredients([], { fetchImpl: jest.fn(), apiKey: 'test' });
    expect(result).toEqual([]);
  });

  it('throws on Anthropic error', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({ ok: false, status: 500, text: async () => 'oops' });
    await expect(translateIngredients(['a'], { fetchImpl, apiKey: 'test' }))
      .rejects.toThrow(/Anthropic 500/);
  });
});
