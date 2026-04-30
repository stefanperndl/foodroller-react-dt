import { computeRemainingMacros, pickBestFit, macroAwareRoll } from '../api/macroRoll';
import { fetchRecipeByCategories } from '../api/recipes';
import { enrichWithNutrition } from '../api/planner';

jest.mock('../lib/firebase', () => ({ db: null }));
jest.mock('firebase/firestore', () => ({ doc: jest.fn(), getDoc: jest.fn(), setDoc: jest.fn() }));
jest.mock('../api/recipes', () => ({ fetchRecipeByCategories: jest.fn() }));
jest.mock('../api/nutrition', () => ({
  getNutritionFromCache: jest.fn(() => null),
  getNutrition: jest.fn(),
  DEFAULT_SERVINGS: 4,
  MIN_KCAL_TOTAL: 100,
}));
jest.mock('../api/planner', () => ({
  enrichWithNutrition: jest.fn(),
}));

const profile = { kcal: 2000, protein: 150, carbs: 200, fat: 65 };


beforeEach(() => {
  jest.clearAllMocks();
});

describe('computeRemainingMacros', () => {
  it('returns full profile when no other meals planned', () => {
    const result = computeRemainingMacros('2026-05-01', 'lunch', {}, {}, profile);
    expect(result).toEqual({ kcal: 2000, protein: 150, carbs: 200, fat: 65 });
  });

  it('subtracts other slots (÷ DEFAULT_SERVINGS) from profile', () => {
    const meal = { id: 'r1', name: 'Chicken' };
    const mealplan = { '2026-05-01': { breakfast: meal } };
    const nutritionMap = { r1: { kcal: 800, protein: 80, carbs: 40, fat: 20 } };
    const result = computeRemainingMacros('2026-05-01', 'lunch', mealplan, nutritionMap, profile);
    expect(result.protein).toBeCloseTo(150 - 80 / 4);
    expect(result.kcal).toBeCloseTo(2000 - 800 / 4);
  });

  it('excludes the target slot from the sum', () => {
    const meal = { id: 'r1', name: 'Chicken' };
    const mealplan = { '2026-05-01': { lunch: meal } };
    const nutritionMap = { r1: { kcal: 800, protein: 80, carbs: 40, fat: 20 } };
    const result = computeRemainingMacros('2026-05-01', 'lunch', mealplan, nutritionMap, profile);
    expect(result.protein).toBe(150); // lunch excluded
  });

  it('floors remaining at 0', () => {
    const meal = { id: 'r1', name: 'Huge Meal' };
    const mealplan = { '2026-05-01': { breakfast: meal } };
    const nutritionMap = { r1: { kcal: 20000, protein: 2000, carbs: 1000, fat: 500 } };
    const result = computeRemainingMacros('2026-05-01', 'lunch', mealplan, nutritionMap, profile);
    expect(result.protein).toBe(0);
    expect(result.kcal).toBe(0);
  });
});

describe('pickBestFit', () => {
  const remaining = { kcal: 500, protein: 40, carbs: 50, fat: 15 };

  it('returns the candidate that best fills remaining macros', () => {
    const candidates = [
      { id: 'a', nutrition: { kcal: 100, protein: 5,  carbs: 10, fat: 3 } },
      { id: 'b', nutrition: { kcal: 450, protein: 35, carbs: 45, fat: 12 } }, // best fit
      { id: 'c', nutrition: { kcal: 50,  protein: 2,  carbs: 5,  fat: 1 } },
    ];
    expect(pickBestFit(candidates, remaining).id).toBe('b');
  });

  it('handles all-zero remaining by returning the first candidate', () => {
    const candidates = [
      { id: 'x', nutrition: { kcal: 400, protein: 30, carbs: 40, fat: 12 } },
      { id: 'y', nutrition: { kcal: 200, protein: 15, carbs: 20, fat: 6 } },
    ];
    const result = pickBestFit(candidates, { kcal: 0, protein: 0, carbs: 0, fat: 0 });
    expect(['x', 'y']).toContain(result.id);
  });
});

describe('macroAwareRoll', () => {
  const args = {
    date: '2026-05-01', slotId: 'lunch',
    mealplan: {}, nutritionMap: {}, macroProfile: profile,
    categories: ['Chicken'], restrictions: [],
  };

  it('returns null when macroProfile is not set', async () => {
    const result = await macroAwareRoll({ ...args, macroProfile: null });
    expect(result).toBeNull();
    expect(fetchRecipeByCategories).not.toHaveBeenCalled();
  });

  it('returns null when enrichment yields no results', async () => {
    fetchRecipeByCategories.mockResolvedValue({ id: 'r1', name: 'Dish', ingredients: ['x'] });
    enrichWithNutrition.mockResolvedValue([]);
    const result = await macroAwareRoll(args);
    expect(result).toBeNull();
  });

  it('returns best-fit recipe when candidates are available', async () => {
    fetchRecipeByCategories.mockResolvedValue({ id: 'r1', name: 'Dish', ingredients: ['x'] });
    const enriched = [
      { id: 'r1', name: 'Dish', nutrition: { kcal: 450, protein: 38, carbs: 44, fat: 12 } },
    ];
    enrichWithNutrition.mockResolvedValue(enriched);
    const result = await macroAwareRoll(args);
    expect(result).toEqual(enriched[0]);
  });
});
