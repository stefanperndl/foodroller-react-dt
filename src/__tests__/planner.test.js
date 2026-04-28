import { generateMealPlan } from '../api/planner';
import * as recipes from '../api/recipes';
import * as nutrition from '../api/nutrition';

jest.mock('../api/recipes');
jest.mock('../api/nutrition');

const mockRecipe = (name, id) => ({
  id,
  name,
  ingredients: ['100g chicken', '1 cup rice'],
  category: 'Chicken',
});

const mockNutrition = { kcal: 400, protein: 30, carbs: 40, fat: 10, fiber: 2 };

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();

  nutrition.getNutritionFromCache.mockReturnValue(null);
  nutrition.getNutrition.mockResolvedValue(mockNutrition);
});

describe('generateMealPlan', () => {
  it('returns a plan with one meal per date', async () => {
    let callCount = 0;
    const names = ['Butter Chicken', 'Pasta', 'Beef Stew', 'Salmon', 'Tacos', 'Curry'];
    recipes.fetchRecipeByCategories.mockImplementation(() => {
      const name = names[callCount % names.length];
      callCount++;
      return Promise.resolve(mockRecipe(name, `id-${callCount}`));
    });

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        content: [{ text: '{"2026-04-28":0,"2026-04-29":1,"2026-04-30":2}' }],
      }),
    });

    const plan = await generateMealPlan({
      startDate: '2026-04-28',
      endDate: '2026-04-30',
      macroProfile: { kcal: 2000, protein: 150, carbs: 200, fat: 60 },
      selectedCategories: [],
      selectedRestrictions: [],
      onProgress: jest.fn(),
    });

    expect(Object.keys(plan)).toHaveLength(3);
    expect(plan['2026-04-28']).toHaveProperty('name');
    expect(plan['2026-04-28'].nutrition).toMatchObject({
      kcal: expect.any(Number),
      protein: expect.any(Number),
    });
  });

  it('calls onProgress at each step', async () => {
    const onProgress = jest.fn();
    let callCount = 0;
    recipes.fetchRecipeByCategories.mockImplementation(() => {
      callCount++;
      return Promise.resolve(mockRecipe(`Recipe ${callCount}`, `id-${callCount}`));
    });

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        content: [{ text: '{"2026-04-28":0}' }],
      }),
    });

    await generateMealPlan({
      startDate: '2026-04-28',
      endDate: '2026-04-28',
      macroProfile: { kcal: 2000, protein: 150, carbs: 200, fat: 60 },
      selectedCategories: [],
      selectedRestrictions: [],
      onProgress,
    });

    expect(onProgress).toHaveBeenCalledWith(expect.stringContaining('Fetching'));
    expect(onProgress).toHaveBeenCalledWith(expect.stringContaining('nutrition'));
    expect(onProgress).toHaveBeenCalledWith(expect.stringContaining('AI'));
  });

  it('throws when not enough recipes are available', async () => {
    recipes.fetchRecipeByCategories.mockRejectedValue(new Error('no recipes'));

    await expect(
      generateMealPlan({
        startDate: '2026-04-28',
        endDate: '2026-04-30',
        macroProfile: { kcal: 2000, protein: 150, carbs: 200, fat: 60 },
        selectedCategories: [],
        selectedRestrictions: [],
        onProgress: jest.fn(),
      })
    ).rejects.toThrow('Not enough recipes');
  });

  it('uses nutrition from cache when available', async () => {
    const cached = { kcal: 600, protein: 45, carbs: 60, fat: 15, fiber: 3 };
    nutrition.getNutritionFromCache.mockReturnValue(cached);

    let callCount = 0;
    recipes.fetchRecipeByCategories.mockImplementation(() => {
      callCount++;
      return Promise.resolve(mockRecipe(`Cached Recipe ${callCount}`, `id-${callCount}`));
    });

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        content: [{ text: '{"2026-04-28":0}' }],
      }),
    });

    const plan = await generateMealPlan({
      startDate: '2026-04-28',
      endDate: '2026-04-28',
      macroProfile: { kcal: 2000, protein: 150, carbs: 200, fat: 60 },
      selectedCategories: [],
      selectedRestrictions: [],
      onProgress: jest.fn(),
    });

    expect(nutrition.getNutrition).not.toHaveBeenCalled();
    expect(plan['2026-04-28'].nutrition.kcal).toBe(Math.round(cached.kcal / 4));
  });

  it('throws when Claude returns an empty plan', async () => {
    let callCount = 0;
    recipes.fetchRecipeByCategories.mockImplementation(() => {
      callCount++;
      return Promise.resolve(mockRecipe(`Recipe ${callCount}`, `id-${callCount}`));
    });

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        content: [{ text: '{}' }],
      }),
    });

    await expect(
      generateMealPlan({
        startDate: '2026-04-28',
        endDate: '2026-04-28',
        macroProfile: { kcal: 2000, protein: 150, carbs: 200, fat: 60 },
        selectedCategories: [],
        selectedRestrictions: [],
        onProgress: jest.fn(),
      })
    ).rejects.toThrow('empty plan');
  });
});
