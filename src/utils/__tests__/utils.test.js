import '@testing-library/jest-dom';
import { mergeIngredients, getDatesInRange } from '../utils';

describe('mergeIngredients', () => {
  it('merges identical ingredients from multiple recipes', () => {
    const ingredientsByRecipe = {
      '2025-10-27': {
        name: 'Recipe A',
        ingredients: ['2 cups flour', '1 cup sugar'],
      },
      '2025-10-28': {
        name: 'Recipe B',
        ingredients: ['1 cups flour', '2 cups milk'],
      },
    };

    const result = mergeIngredients(ingredientsByRecipe);
    
    const flour = result.find(item => item.name === 'flour' && item.unit === 'cups');
    expect(flour).toBeDefined();
    expect(flour.qty).toBe(3);
    expect(flour.meals).toEqual(['Recipe A', 'Recipe B']);
  });

  it('keeps different units separate', () => {
    const ingredientsByRecipe = {
      '2025-10-27': {
        name: 'Recipe A',
        ingredients: ['2 cups flour', '100 g flour'],
      },
    };

    const result = mergeIngredients(ingredientsByRecipe);
    
    expect(result).toHaveLength(2);
    expect(result.find(item => item.unit === 'cups')).toBeDefined();
    expect(result.find(item => item.unit === 'g')).toBeDefined();
  });

  it('handles ingredients without units', () => {
    const ingredientsByRecipe = {
      '2025-10-27': {
        name: 'Recipe A',
        ingredients: ['2 eggs', '3 tomatoes'],
      },
    };

    const result = mergeIngredients(ingredientsByRecipe);
    
    expect(result).toHaveLength(2);
    const eggs = result.find(item => item.name === 'eggs');
    expect(eggs.qty).toBe(2);
    expect(eggs.unit).toBe('');
  });

  it('handles ingredients without quantities', () => {
    const ingredientsByRecipe = {
      '2025-10-27': {
        name: 'Recipe A',
        ingredients: ['salt', 'pepper'],
      },
    };

    const result = mergeIngredients(ingredientsByRecipe);
    
    expect(result).toHaveLength(2);
    result.forEach(item => {
      expect(item.qty).toBe(1);
    });
  });

  it('converts tbs to ml for liquids', () => {
    const ingredientsByRecipe = {
      '2025-10-27': {
        name: 'Recipe A',
        ingredients: ['2 tbs milk', '3 tbs water', '1 tbs juice'],
      },
    };

    const result = mergeIngredients(ingredientsByRecipe);
    
    result.forEach(item => {
      expect(item.unit).toBe('ml');
    });
    
    const milk = result.find(item => item.name === 'milk');
    expect(milk.qty).toBe(200); // 2 tbs * 100
  });

  it('converts tbs to g for non-liquids', () => {
    const ingredientsByRecipe = {
      '2025-10-27': {
        name: 'Recipe A',
        ingredients: ['3 tbs flour', '2 tbs sugar'],
      },
    };

    const result = mergeIngredients(ingredientsByRecipe);
    
    result.forEach(item => {
      expect(item.unit).toBe('g');
    });
    
    const flour = result.find(item => item.name === 'flour');
    expect(flour.qty).toBe(300); // 3 tbs * 100
  });

  it('tracks which meals need each ingredient', () => {
    const ingredientsByRecipe = {
      '2025-10-27': {
        name: 'Breakfast',
        ingredients: ['2 eggs'],
      },
      '2025-10-28': {
        name: 'Lunch',
        ingredients: ['3 eggs'],
      },
      '2025-10-29': {
        name: 'Dinner',
        ingredients: ['1 eggs'],
      },
    };

    const result = mergeIngredients(ingredientsByRecipe);
    
    const eggs = result.find(item => item.name === 'eggs');
    expect(eggs.qty).toBe(6);
    expect(eggs.meals).toEqual(['Breakfast', 'Lunch', 'Dinner']);
  });

  it('handles case-insensitive ingredient names', () => {
    const ingredientsByRecipe = {
      '2025-10-27': {
        name: 'Recipe A',
        ingredients: ['2 cups FLOUR', '1 cups Flour'],
      },
    };

    const result = mergeIngredients(ingredientsByRecipe);
    
    const flour = result.find(item => item.name === 'flour');
    expect(flour.qty).toBe(3);
  });

  it('handles decimal quantities', () => {
    const ingredientsByRecipe = {
      '2025-10-27': {
        name: 'Recipe A',
        ingredients: ['1.5 cups flour', '0.5 cups flour'],
      },
    };

    const result = mergeIngredients(ingredientsByRecipe);
    
    const flour = result.find(item => item.name === 'flour');
    expect(flour.qty).toBe(2);
  });

  it('handles empty ingredient lists', () => {
    const ingredientsByRecipe = {
      '2025-10-27': {
        name: 'Recipe A',
        ingredients: [],
      },
    };

    const result = mergeIngredients(ingredientsByRecipe);
    
    expect(result).toEqual([]);
  });

  it('handles recipes without name', () => {
    const ingredientsByRecipe = {
      '2025-10-27': {
        ingredients: ['2 eggs'],
      },
    };

    const result = mergeIngredients(ingredientsByRecipe);
    
    const eggs = result.find(item => item.name === 'eggs');
    expect(eggs.meals).toEqual(['Recipe']);
  });

  it('handles malformed ingredient strings', () => {
    const ingredientsByRecipe = {
      '2025-10-27': {
        name: 'Recipe A',
        ingredients: ['', '   ', 'invalid'],
      },
    };

    const result = mergeIngredients(ingredientsByRecipe);
    
    // Should not crash, might have some results
    expect(Array.isArray(result)).toBe(true);
  });

  it('sums quantities of same ingredient from same recipe', () => {
    const ingredientsByRecipe = {
      '2025-10-27': {
        name: 'Recipe A',
        ingredients: ['1 cups flour', '1 cups flour', '1 cups flour'],
      },
    };

    const result = mergeIngredients(ingredientsByRecipe);
    
    const flour = result.find(item => item.name === 'flour');
    expect(flour.qty).toBe(3);
    expect(flour.meals).toEqual(['Recipe A']); // Same recipe, listed once
  });
});

describe('getDatesInRange', () => {
  it('returns array of dates between start and end', () => {
    const start = new Date('2025-10-27');
    const end = new Date('2025-10-29');

    const result = getDatesInRange(start, end);

    expect(result).toHaveLength(3);
    expect(result[0].toISOString().split('T')[0]).toBe('2025-10-27');
    expect(result[1].toISOString().split('T')[0]).toBe('2025-10-28');
    expect(result[2].toISOString().split('T')[0]).toBe('2025-10-29');
  });

  it('returns single date when start equals end', () => {
    const date = new Date('2025-10-27');

    const result = getDatesInRange(date, date);

    expect(result).toHaveLength(1);
    expect(result[0].toISOString().split('T')[0]).toBe('2025-10-27');
  });

  it('returns empty array when start is after end', () => {
    const start = new Date('2025-10-29');
    const end = new Date('2025-10-27');

    const result = getDatesInRange(start, end);

    expect(result).toHaveLength(0);
  });

  it('handles month boundaries correctly', () => {
    const start = new Date('2025-10-30');
    const end = new Date('2025-11-02');

    const result = getDatesInRange(start, end);

    expect(result).toHaveLength(4);
    expect(result[0].toISOString().split('T')[0]).toBe('2025-10-30');
    expect(result[1].toISOString().split('T')[0]).toBe('2025-10-31');
    expect(result[2].toISOString().split('T')[0]).toBe('2025-11-01');
    expect(result[3].toISOString().split('T')[0]).toBe('2025-11-02');
  });

  it('handles year boundaries correctly', () => {
    const start = new Date('2025-12-30');
    const end = new Date('2026-01-02');

    const result = getDatesInRange(start, end);

    expect(result).toHaveLength(4);
    expect(result[0].getFullYear()).toBe(2025);
    expect(result[3].getFullYear()).toBe(2026);
  });
});
