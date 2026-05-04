import { getNutrition, getNutritionFromCache } from '../api/nutrition';
import { getDoc, setDoc } from 'firebase/firestore';

jest.mock('../lib/firebase', () => ({ db: null }));
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
}));

const mockItems = [
  { calories: 200, protein_g: 25, carbohydrates_total_g: 10, fat_total_g: 8, fiber_g: 2 },
  { calories: 150, protein_g: 5,  carbohydrates_total_g: 30, fat_total_g: 2, fiber_g: 1 },
];

beforeEach(() => {
  localStorage.clear();
  global.fetch = jest.fn();
  getDoc.mockReset();
  setDoc.mockReset();
});

describe('getNutritionFromCache', () => {
  it('returns null for missing id', () => {
    expect(getNutritionFromCache(null)).toBeNull();
  });

  it('returns null when nothing cached', () => {
    expect(getNutritionFromCache('recipe-x')).toBeNull();
  });

  it('returns parsed value from localStorage', () => {
    const data = { kcal: 300, protein: 20, carbs: 30, fat: 10, fiber: 3 };
    localStorage.setItem('nutrition_v1_recipe-x', JSON.stringify(data));
    expect(getNutritionFromCache('recipe-x')).toEqual(data);
  });
});

describe('getNutrition', () => {
  it('fetches and sums nutrition from CalorieNinjas', async () => {
    fetch.mockResolvedValue({ ok: true, json: async () => ({ items: mockItems }) });

    const result = await getNutrition('recipe-1', ['200g chicken', '1 cup rice']);

    expect(result.kcal).toBeCloseTo(350);
    expect(result.protein).toBeCloseTo(30);
    expect(result.carbs).toBeCloseTo(40);
    expect(result.fat).toBeCloseTo(10);
    expect(result.fiber).toBeCloseTo(3);
    expect(fetch).toHaveBeenCalledWith('/api/nutrition', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ ingredients: ['200g chicken', '1 cup rice'] }),
    }));
  });

  it('caches result in localStorage', async () => {
    fetch.mockResolvedValue({ ok: true, json: async () => ({ items: mockItems }) });

    await getNutrition('recipe-2', ['200g chicken']);
    await getNutrition('recipe-2', ['200g chicken']);

    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('returns localStorage cached value without hitting API', async () => {
    const cached = { kcal: 500, protein: 40, carbs: 50, fat: 20, fiber: 5 };
    localStorage.setItem('nutrition_v1_recipe-3', JSON.stringify(cached));

    const result = await getNutrition('recipe-3', ['something']);

    expect(fetch).not.toHaveBeenCalled();
    expect(result).toEqual(cached);
  });

  it('returns null for empty ingredients', async () => {
    const result = await getNutrition('recipe-4', []);
    expect(result).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('throws when API returns non-ok status', async () => {
    fetch.mockResolvedValue({ ok: false, status: 403 });
    await expect(getNutrition('recipe-5', ['1 egg'])).rejects.toThrow('CalorieNinjas error: 403');
  });

  it('skips Firestore when db is null', async () => {
    fetch.mockResolvedValue({ ok: true, json: async () => ({ items: mockItems }) });

    await getNutrition('recipe-nodb', ['chicken']);

    expect(getDoc).not.toHaveBeenCalled();
    expect(setDoc).not.toHaveBeenCalled();
  });
});
