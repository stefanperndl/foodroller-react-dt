import {
  validateMealAgainstRestrictions,
  getCompatibleCategories,
  getMatchingDietaryRestrictions,
} from '../utils/dietaryRestrictions';

describe('validateMealAgainstRestrictions', () => {
  it('passes a meal with no active restrictions', () => {
    const meal = { category: 'Beef', ingredients: ['500g beef', '1 onion'] };
    expect(validateMealAgainstRestrictions(meal, [])).toBe(true);
  });

  it('rejects a meal whose category is excluded', () => {
    const meal = { category: 'Beef', ingredients: [] };
    expect(validateMealAgainstRestrictions(meal, ['vegetarian'])).toBe(false);
  });

  it('rejects a meal containing an excluded ingredient', () => {
    const meal = { category: 'Vegetarian', ingredients: ['200g chicken breast'] };
    expect(validateMealAgainstRestrictions(meal, ['vegetarian'])).toBe(false);
  });

  it('passes a vegetarian meal with compatible ingredients', () => {
    const meal = { category: 'Vegetarian', ingredients: ['200g tofu', '1 onion'] };
    expect(validateMealAgainstRestrictions(meal, ['vegetarian'])).toBe(true);
  });

  it('is case-insensitive for ingredient matching', () => {
    const meal = { category: 'Vegetarian', ingredients: ['200g Chicken'] };
    expect(validateMealAgainstRestrictions(meal, ['vegetarian'])).toBe(false);
  });

  it('must satisfy all active restrictions simultaneously', () => {
    const meal = { category: 'Seafood', ingredients: ['200g salmon'] };
    // vegetarian excludes seafood
    expect(validateMealAgainstRestrictions(meal, ['vegetarian', 'pescatarian'])).toBe(false);
  });
});

describe('getCompatibleCategories', () => {
  const allCategories = [
    { idCategory: '1', strCategory: 'Beef' },
    { idCategory: '2', strCategory: 'Vegetarian' },
    { idCategory: '3', strCategory: 'Chicken' },
    { idCategory: '4', strCategory: 'Seafood' },
  ];

  it('returns all categories when no restrictions active', () => {
    expect(getCompatibleCategories([], allCategories)).toHaveLength(4);
  });

  it('excludes restricted categories', () => {
    const result = getCompatibleCategories(['vegetarian'], allCategories);
    const names = result.map(c => c.strCategory);
    expect(names).not.toContain('Beef');
    expect(names).not.toContain('Chicken');
    expect(names).toContain('Vegetarian');
  });
});

describe('getMatchingDietaryRestrictions', () => {
  it('returns vegan label for a fully plant-based meal', () => {
    const meal = { category: 'Vegetarian', ingredients: ['200g tofu', '1 onion'] };
    const labels = getMatchingDietaryRestrictions(meal).map(d => d.key);
    expect(labels).toContain('vegan');
    expect(labels).toContain('vegetarian');
  });

  it('returns empty array for a meat meal', () => {
    const meal = { category: 'Beef', ingredients: ['500g beef'] };
    expect(getMatchingDietaryRestrictions(meal)).toHaveLength(0);
  });
});
