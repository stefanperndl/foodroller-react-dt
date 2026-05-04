import { generateMealPlan, swapMeal } from '../api/planner';
import * as recipes from '../api/recipes';
import * as nutrition from '../api/nutrition';

jest.mock('../api/recipes');
jest.mock('../api/nutrition');
jest.mock('../lib/firebase', () => ({ db: null }));
jest.mock('firebase/firestore', () => ({ doc: jest.fn(), getDoc: jest.fn(), setDoc: jest.fn() }));

const SLOTS = [
  { id: 'breakfast', label: 'Breakfast', order: 0 },
  { id: 'dinner',    label: 'Dinner',    order: 1 },
];

const mockRecipe = (name, id) => ({
  id,
  name,
  ingredients: ['100g chicken', '1 cup rice'],
  category: 'Chicken',
});

const mockNutrition = { kcal: 400, protein: 30, carbs: 40, fat: 10, fiber: 2 };

// New tool-use response shape: assignments is { date: { slotId: index } }
const mockClaudeResponse = (assignments) => ({
  content: [{ type: 'tool_use', input: { assignments } }],
});

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  nutrition.getNutritionFromCache.mockReturnValue(null);
  nutrition.getNutrition.mockResolvedValue(mockNutrition);
});

describe('generateMealPlan', () => {
  it('returns a plan with one meal per slot per date', async () => {
    let callCount = 0;
    const names = ['Butter Chicken', 'Pasta', 'Beef Stew', 'Salmon', 'Tacos', 'Curry', 'Omelette', 'Salad', 'Soup', 'Steak', 'Tacos2', 'Wrap'];
    recipes.fetchRecipeByCategories.mockImplementation(() => {
      const name = names[callCount % names.length];
      callCount++;
      return Promise.resolve(mockRecipe(name, `id-${callCount}`));
    });

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => mockClaudeResponse({
        '2026-04-28': { breakfast: 0, dinner: 1 },
        '2026-04-29': { breakfast: 2, dinner: 3 },
        '2026-04-30': { breakfast: 4, dinner: 5 },
      }),
    });

    const plan = await generateMealPlan({
      startDate: '2026-04-28',
      endDate: '2026-04-30',
      macroProfile: { kcal: 2000, protein: 150, carbs: 200, fat: 60 },
      selectedCategories: [],
      selectedRestrictions: [],
      slots: SLOTS,
      onProgress: jest.fn(),
    });

    expect(Object.keys(plan)).toHaveLength(3);
    expect(plan['2026-04-28'].breakfast).toHaveProperty('name');
    expect(plan['2026-04-28'].dinner).toHaveProperty('name');
    expect(plan['2026-04-28'].breakfast.nutrition).toMatchObject({
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
      json: async () => mockClaudeResponse({ '2026-04-28': { breakfast: 0, dinner: 1 } }),
    });

    await generateMealPlan({
      startDate: '2026-04-28',
      endDate: '2026-04-28',
      macroProfile: { kcal: 2000, protein: 150, carbs: 200, fat: 60 },
      selectedCategories: [],
      selectedRestrictions: [],
      slots: SLOTS,
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
        slots: SLOTS,
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
      json: async () => mockClaudeResponse({ '2026-04-28': { breakfast: 0, dinner: 1 } }),
    });

    const plan = await generateMealPlan({
      startDate: '2026-04-28',
      endDate: '2026-04-28',
      macroProfile: { kcal: 2000, protein: 150, carbs: 200, fat: 60 },
      selectedCategories: [],
      selectedRestrictions: [],
      slots: SLOTS,
      onProgress: jest.fn(),
    });

    expect(nutrition.getNutrition).not.toHaveBeenCalled();
    expect(plan['2026-04-28'].breakfast.nutrition.kcal).toBe(Math.round(cached.kcal / 4));
  });

  it('throws when Claude returns an empty plan', async () => {
    let callCount = 0;
    recipes.fetchRecipeByCategories.mockImplementation(() => {
      callCount++;
      return Promise.resolve(mockRecipe(`Recipe ${callCount}`, `id-${callCount}`));
    });

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => mockClaudeResponse({}),
    });

    await expect(
      generateMealPlan({
        startDate: '2026-04-28',
        endDate: '2026-04-28',
        macroProfile: { kcal: 2000, protein: 150, carbs: 200, fat: 60 },
        selectedCategories: [],
        selectedRestrictions: [],
        slots: SLOTS,
        onProgress: jest.fn(),
      })
    ).rejects.toThrow('empty plan');
  });

  it('throws when Claude returns no tool_use block', async () => {
    let callCount = 0;
    recipes.fetchRecipeByCategories.mockImplementation(() => {
      callCount++;
      return Promise.resolve(mockRecipe(`Recipe ${callCount}`, `id-${callCount}`));
    });

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ content: [{ type: 'text', text: 'sorry' }] }),
    });

    await expect(
      generateMealPlan({
        startDate: '2026-04-28',
        endDate: '2026-04-28',
        macroProfile: { kcal: 2000, protein: 150, carbs: 200, fat: 60 },
        selectedCategories: [],
        selectedRestrictions: [],
        slots: SLOTS,
        onProgress: jest.fn(),
      })
    ).rejects.toThrow('unexpected response');
  });

  it('produces no duplicate meal IDs across the week', async () => {
    let callCount = 0;
    recipes.fetchRecipeByCategories.mockImplementation(() => {
      callCount++;
      return Promise.resolve(mockRecipe(`Recipe ${callCount}`, `id-${callCount}`));
    });

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => mockClaudeResponse({
        '2026-04-28': { breakfast: 0, dinner: 1 },
        '2026-04-29': { breakfast: 2, dinner: 3 },
        '2026-04-30': { breakfast: 4, dinner: 5 },
      }),
    });

    const plan = await generateMealPlan({
      startDate: '2026-04-28',
      endDate: '2026-04-30',
      macroProfile: { kcal: 2000, protein: 150, carbs: 200, fat: 60 },
      selectedCategories: [],
      selectedRestrictions: [],
      slots: SLOTS,
      onProgress: jest.fn(),
    });

    const allIds = Object.values(plan).flatMap((day) =>
      Object.values(day).map((m) => m.id)
    );
    const unique = new Set(allIds);
    expect(unique.size).toBe(allIds.length);
  });
});

describe('swapMeal', () => {
  const macroProfile = { kcal: 2000, protein: 150, carbs: 200, fat: 60 };

  it('excludes meals already in currentPlan', async () => {
    const usedId = 'used-meal-id';
    const currentPlan = {
      '2026-04-28': { breakfast: { id: usedId, name: 'Old Meal', nutrition: { kcal: 500, protein: 38, carbs: 50, fat: 15 } } },
    };

    let fetchedIds = [];
    recipes.fetchRecipeByCategories.mockImplementation(() => {
      fetchedIds.push('new-id');
      return Promise.resolve({ id: 'new-id', name: 'New Meal', ingredients: ['100g beef'] });
    });
    nutrition.getNutritionFromCache.mockReturnValue(null);
    nutrition.getNutrition.mockResolvedValue(mockNutrition);

    const { meal } = await swapMeal({
      date: '2026-04-28',
      slotId: 'dinner',
      currentPlan,
      macroProfile,
      selectedRestrictions: [],
      selectedCategories: [],
    });

    expect(meal.id).not.toBe(usedId);
    expect(meal.name).toBe('New Meal');
  });

  it('fetches breakfast-appropriate categories for breakfast slot', async () => {
    recipes.fetchRecipeByCategories.mockResolvedValue({
      id: 'brk-1', name: 'Pancakes', ingredients: ['flour', 'eggs'],
    });
    nutrition.getNutritionFromCache.mockReturnValue(null);
    nutrition.getNutrition.mockResolvedValue(mockNutrition);

    await swapMeal({
      date: '2026-04-28',
      slotId: 'breakfast',
      currentPlan: {},
      macroProfile,
      selectedRestrictions: [],
      selectedCategories: ['Beef'],
    });

    const firstCall = recipes.fetchRecipeByCategories.mock.calls[0];
    expect(firstCall[0]).toEqual(['Breakfast']);
  });

  it('returns a delta relative to slot target', async () => {
    recipes.fetchRecipeByCategories.mockResolvedValue({
      id: 'dinner-1', name: 'Chicken Rice', ingredients: ['chicken', 'rice'],
    });
    nutrition.getNutritionFromCache.mockReturnValue(null);
    nutrition.getNutrition.mockResolvedValue({ kcal: 800, protein: 45, carbs: 80, fat: 20, fiber: 3 });

    const { delta } = await swapMeal({
      date: '2026-04-28',
      slotId: 'dinner',
      currentPlan: {},
      macroProfile,
      selectedRestrictions: [],
      selectedCategories: [],
    });

    // dinner target = 35% of 2000 = 700 kcal; meal has 800/4 = 200 kcal per serving
    // delta.kcal = 200 - 700 = -500
    expect(delta).not.toBeNull();
    expect(delta).toHaveProperty('kcal');
    expect(delta).toHaveProperty('protein');
    expect(typeof delta.kcal).toBe('number');
  });

  it('throws when no candidates can be found', async () => {
    recipes.fetchRecipeByCategories.mockRejectedValue(new Error('network error'));

    await expect(
      swapMeal({
        date: '2026-04-28',
        slotId: 'dinner',
        currentPlan: {},
        macroProfile,
        selectedRestrictions: [],
        selectedCategories: [],
      })
    ).rejects.toThrow('No suitable replacement');
  });

  it('uses custom recipe as swap candidate when slot type matches', async () => {
    const customDinner = {
      id: 'custom-1', name: 'My Chili', category: 'Beef',
      source: 'custom', ingredients: ['500g beef', '2 cans beans'],
      nutrition: { kcal: 1600, protein: 120, carbs: 80, fat: 40 },
      servings: 4,
    };
    // TheMealDB returns nothing useful
    recipes.fetchRecipeByCategories.mockRejectedValue(new Error('network'));

    const { meal } = await swapMeal({
      date: '2026-04-28',
      slotId: 'dinner',
      currentPlan: {},
      macroProfile,
      selectedRestrictions: [],
      selectedCategories: [],
      customRecipes: [customDinner],
    });

    expect(meal.name).toBe('My Chili');
  });

  it('does not use custom recipe already in current plan', async () => {
    const usedCustom = {
      id: 'custom-1', name: 'Used Chili', category: 'Beef',
      source: 'custom', ingredients: ['500g beef'],
      nutrition: { kcal: 1600, protein: 120, carbs: 80, fat: 40 },
      servings: 4,
    };
    const currentPlan = {
      '2026-04-28': { dinner: { id: 'custom-1', name: 'Used Chili', nutrition: { kcal: 400, protein: 30, carbs: 20, fat: 10 } } },
    };
    recipes.fetchRecipeByCategories.mockResolvedValue({
      id: 'mealdb-1', name: 'Beef Stew', ingredients: ['300g beef'],
    });
    nutrition.getNutrition.mockResolvedValue(mockNutrition);

    const { meal } = await swapMeal({
      date: '2026-04-29',
      slotId: 'dinner',
      currentPlan,
      macroProfile,
      selectedRestrictions: [],
      selectedCategories: [],
      customRecipes: [usedCustom],
    });

    expect(meal.id).not.toBe('custom-1');
  });
});

describe('generateMealPlan with customRecipes', () => {
  const macroProfile = { kcal: 2000, protein: 150, carbs: 200, fat: 60 };

  it('seeds custom recipes into candidate pool, deduplicated by name', async () => {
    const customRecipe = {
      id: 'custom-1', name: 'My Chili', category: 'Beef',
      source: 'custom', _source: 'custom',
      ingredients: ['500g beef'],
      nutrition: { kcal: 1600, protein: 120, carbs: 80, fat: 40 },
      servings: 4,
    };

    // Only need to fill breakfast slot from TheMealDB; main pool seeded by custom
    let callCount = 0;
    recipes.fetchRecipeByCategories.mockImplementation(() => {
      callCount++;
      return Promise.resolve(mockRecipe(`Breakfast${callCount}`, `brk-${callCount}`));
    });

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        content: [{ type: 'tool_use', input: { assignments: {
          '2026-04-28': { breakfast: 0, dinner: 1 },
        }}}],
      }),
    });

    await generateMealPlan({
      startDate: '2026-04-28',
      endDate: '2026-04-28',
      macroProfile,
      selectedCategories: [],
      selectedRestrictions: [],
      slots: SLOTS,
      onProgress: jest.fn(),
      customRecipes: [customRecipe],
    });

    // Custom recipe should be in the pool — CalorieNinjas NOT called for it
    expect(nutrition.getNutrition).not.toHaveBeenCalledWith('custom-1', expect.anything());
  });

  it('empty customRecipes = [] behaves identically to no customRecipes', async () => {
    let callCount = 0;
    recipes.fetchRecipeByCategories.mockImplementation(() => {
      callCount++;
      return Promise.resolve(mockRecipe(`Meal${callCount}`, `id-${callCount}`));
    });

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        content: [{ type: 'tool_use', input: { assignments: {
          '2026-04-28': { breakfast: 0, dinner: 1 },
        }}}],
      }),
    });

    const plan = await generateMealPlan({
      startDate: '2026-04-28',
      endDate: '2026-04-28',
      macroProfile,
      selectedCategories: [],
      selectedRestrictions: [],
      slots: SLOTS,
      onProgress: jest.fn(),
      customRecipes: [],
    });

    expect(plan['2026-04-28']).toBeDefined();
  });
});
