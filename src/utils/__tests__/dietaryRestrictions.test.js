import '@testing-library/jest-dom';
import { 
  DIETARY_RESTRICTIONS,
  validateMealAgainstRestrictions,
  getMatchingDietaryRestrictions,
  getCompatibleCategories
} from '../dietaryRestrictions';

describe('dietaryRestrictions', () => {
  describe('validateMealAgainstRestrictions', () => {
    it('validates vegetarian meals correctly', () => {
      const vegetarianMeal = {
        category: 'Vegetarian',
        ingredients: ['tomato', 'onion', 'garlic', 'olive oil'],
      };

      expect(validateMealAgainstRestrictions(vegetarianMeal, ['vegetarian'])).toBe(true);
    });

    it('rejects non-vegetarian meals', () => {
      const meatMeal = {
        category: 'Chicken',
        ingredients: ['chicken breast', 'onion', 'garlic'],
      };

      expect(validateMealAgainstRestrictions(meatMeal, ['vegetarian'])).toBe(false);
    });

    it('validates vegan meals correctly', () => {
      const veganMeal = {
        category: 'Vegan',
        ingredients: ['tomato', 'onion', 'garlic', 'olive oil'],
      };

      expect(validateMealAgainstRestrictions(veganMeal, ['vegan'])).toBe(true);
    });

    it('rejects vegan meals with dairy', () => {
      const mealWithDairy = {
        category: 'Vegetarian',
        ingredients: ['pasta', 'cheese', 'tomato sauce'],
      };

      expect(validateMealAgainstRestrictions(mealWithDairy, ['vegan'])).toBe(false);
    });

    it('rejects vegan meals with eggs', () => {
      const mealWithEggs = {
        category: 'Vegetarian',
        ingredients: ['flour', 'egg', 'sugar', 'vanilla'],
      };

      expect(validateMealAgainstRestrictions(mealWithEggs, ['vegan'])).toBe(false);
    });

    it('validates pescatarian meals correctly', () => {
      const fishMeal = {
        category: 'Seafood',
        ingredients: ['salmon', 'lemon', 'dill', 'olive oil'],
      };

      expect(validateMealAgainstRestrictions(fishMeal, ['pescatarian'])).toBe(true);
    });

    it('rejects pescatarian meals with meat', () => {
      const meatMeal = {
        category: 'Chicken',
        ingredients: ['chicken', 'rice', 'vegetables'],
      };

      expect(validateMealAgainstRestrictions(meatMeal, ['pescatarian'])).toBe(false);
    });

    it('handles case-insensitive ingredient matching', () => {
      const meal = {
        category: 'Dessert',
        ingredients: ['Flour', 'BUTTER', 'Sugar', 'Milk'],
      };

      expect(validateMealAgainstRestrictions(meal, ['vegan'])).toBe(false);
    });

    it('returns true when no restrictions are provided', () => {
      const meal = {
        category: 'Chicken',
        ingredients: ['chicken', 'rice'],
      };

      expect(validateMealAgainstRestrictions(meal, [])).toBe(true);
    });

    it('rejects meal by category exclusion', () => {
      const beefMeal = {
        category: 'Beef',
        ingredients: ['beef', 'potatoes'],
      };

      expect(validateMealAgainstRestrictions(beefMeal, ['vegetarian'])).toBe(false);
    });
  });

  describe('getMatchingDietaryRestrictions', () => {
    it('returns correct restrictions for vegetarian meal', () => {
      const vegetarianMeal = {
        category: 'Vegetarian',
        ingredients: ['tomato', 'onion', 'garlic'],
      };

      const restrictions = getMatchingDietaryRestrictions(vegetarianMeal);
      
      expect(restrictions).toContainEqual({
        key: 'vegetarian',
        name: 'Vegetarian',
        icon: '🌱'
      });
    });

    it('returns vegan and vegetarian for vegan meals', () => {
      const veganMeal = {
        category: 'Vegan',
        ingredients: ['tomato', 'onion', 'garlic'],
      };

      const restrictions = getMatchingDietaryRestrictions(veganMeal);
      const keys = restrictions.map(r => r.key);
      
      expect(keys).toContain('vegan');
      expect(keys).toContain('vegetarian');
      expect(keys).toContain('pescatarian');
    });

    it('returns empty array for meat-based meals', () => {
      const meatMeal = {
        category: 'Chicken',
        ingredients: ['chicken', 'rice'],
      };

      const restrictions = getMatchingDietaryRestrictions(meatMeal);
      
      expect(restrictions).toEqual([]);
    });

    it('returns pescatarian for fish meals', () => {
      const fishMeal = {
        category: 'Seafood',
        ingredients: ['salmon', 'lemon'],
      };

      const restrictions = getMatchingDietaryRestrictions(fishMeal);
      const keys = restrictions.map(r => r.key);
      
      expect(keys).toContain('pescatarian');
    });
  });

  describe('DIETARY_RESTRICTIONS object', () => {
    it('has correct structure for vegetarian', () => {
      expect(DIETARY_RESTRICTIONS.vegetarian).toBeDefined();
      expect(DIETARY_RESTRICTIONS.vegetarian.name).toBe('Vegetarian');
      expect(DIETARY_RESTRICTIONS.vegetarian.icon).toBe('🌱');
      expect(DIETARY_RESTRICTIONS.vegetarian.excludeCategories).toContain('Beef');
      expect(DIETARY_RESTRICTIONS.vegetarian.excludeIngredients).toContain('beef');
    });

    it('has correct structure for vegan', () => {
      expect(DIETARY_RESTRICTIONS.vegan).toBeDefined();
      expect(DIETARY_RESTRICTIONS.vegan.name).toBe('Vegan');
      expect(DIETARY_RESTRICTIONS.vegan.icon).toBe('🥗');
      expect(DIETARY_RESTRICTIONS.vegan.excludeIngredients).toContain('cheese');
      expect(DIETARY_RESTRICTIONS.vegan.excludeIngredients).toContain('egg');
    });

    it('has correct structure for pescatarian', () => {
      expect(DIETARY_RESTRICTIONS.pescatarian).toBeDefined();
      expect(DIETARY_RESTRICTIONS.pescatarian.name).toBe('Pescatarian');
      expect(DIETARY_RESTRICTIONS.pescatarian.icon).toBe('🐟');
      expect(DIETARY_RESTRICTIONS.pescatarian.excludeCategories).toContain('Chicken');
      expect(DIETARY_RESTRICTIONS.pescatarian.excludeCategories).not.toContain('Seafood');
    });
  });

  describe('getCompatibleCategories', () => {
    const allCategories = [
      { strCategory: 'Beef' },
      { strCategory: 'Chicken' },
      { strCategory: 'Seafood' },
      { strCategory: 'Vegetarian' },
      { strCategory: 'Dessert' },
    ];

    it('returns all categories when no restrictions', () => {
      const result = getCompatibleCategories([], allCategories);
      expect(result).toEqual(allCategories);
    });

    it('filters out meat categories for vegetarian', () => {
      const result = getCompatibleCategories(['vegetarian'], allCategories);
      const categories = result.map(c => c.strCategory);
      
      expect(categories).not.toContain('Beef');
      expect(categories).not.toContain('Chicken');
      expect(categories).not.toContain('Seafood');
      expect(categories).toContain('Vegetarian');
      expect(categories).toContain('Dessert');
    });

    it('allows seafood for pescatarian', () => {
      const result = getCompatibleCategories(['pescatarian'], allCategories);
      const categories = result.map(c => c.strCategory);
      
      expect(categories).not.toContain('Beef');
      expect(categories).not.toContain('Chicken');
      expect(categories).toContain('Seafood');
      expect(categories).toContain('Vegetarian');
    });
  });
});
