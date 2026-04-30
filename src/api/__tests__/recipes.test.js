import { 
  fetchMealById, 
  fetchRecipeByCategories, 
  fetchRecipe 
} from '../recipes';

// Mock fetch globally
global.fetch = jest.fn();

describe('recipes API', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  describe('fetchMealById', () => {
    it('fetches meal by ID and returns normalized data', async () => {
      const mockApiResponse = {
        meals: [{
          idMeal: '52772',
          strMeal: 'Teriyaki Chicken',
          strMealThumb: 'https://example.com/image.jpg',
          strCategory: 'Chicken',
          strArea: 'Japanese',
          strTags: 'Meat,Dinner',
          strInstructions: 'Cook the chicken...',
          strIngredient1: 'Chicken',
          strMeasure1: '1 lb',
          strIngredient2: 'Soy Sauce',
          strMeasure2: '3 tbsp',
          strIngredient3: '',
          strMeasure3: '',
        }]
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      });

      const result = await fetchMealById('52772');

      expect(fetch).toHaveBeenCalledWith(
        'https://www.themealdb.com/api/json/v1/1/lookup.php?i=52772'
      );
      expect(result.id).toBe('52772');
      expect(result.name).toBe('Teriyaki Chicken');
      expect(result.category).toBe('Chicken');
      expect(result.area).toBe('Japanese');
      expect(result.tags).toEqual(['Meat', 'Dinner']);
      expect(result.ingredients).toHaveLength(2);
      expect(result.ingredients[0]).toBe('1 lb Chicken');
      expect(result.ingredients[1]).toBe('3 tbsp Soy Sauce');
    });

    it('handles missing tags gracefully', async () => {
      const mockApiResponse = {
        meals: [{
          idMeal: '123',
          strMeal: 'Test Meal',
          strMealThumb: 'image.jpg',
          strCategory: 'Test',
          strArea: 'Unknown',
          strTags: null,
          strInstructions: 'Test',
          strIngredient1: 'Ingredient',
          strMeasure1: '1 cup',
        }]
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      });

      const result = await fetchMealById('123');

      expect(result.tags).toEqual([]);
    });

    it('filters out empty ingredients', async () => {
      const mockApiResponse = {
        meals: [{
          idMeal: '123',
          strMeal: 'Test',
          strMealThumb: 'image.jpg',
          strCategory: 'Test',
          strInstructions: 'Test',
          strIngredient1: 'Ingredient 1',
          strMeasure1: '1 cup',
          strIngredient2: '',
          strMeasure2: '',
          strIngredient3: 'Ingredient 3',
          strMeasure3: '2 tsp',
        }]
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      });

      const result = await fetchMealById('123');

      expect(result.ingredients).toHaveLength(2);
      expect(result.ingredients[0]).toBe('1 cup Ingredient 1');
      expect(result.ingredients[1]).toBe('2 tsp Ingredient 3');
    });

    it('throws error when meal not found', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ meals: null }),
      });

      await expect(fetchMealById('999')).rejects.toThrow();
    });

    it('throws error on network failure', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(fetchMealById('123')).rejects.toThrow('Network error');
    });
  });

  describe('fetchRecipeByCategories', () => {
    it('fetches random recipe from specified categories', async () => {
      const mockCategoryResponse = {
        meals: [{
          idMeal: '456',
          strMeal: 'Chicken Curry',
          strMealThumb: 'curry.jpg',
        }]
      };

      const mockDetailResponse = {
        meals: [{
          idMeal: '456',
          strMeal: 'Chicken Curry',
          strMealThumb: 'curry.jpg',
          strCategory: 'Chicken',
          strInstructions: 'Cook the curry',
          strArea: 'Indian',
          strTags: 'Spicy,Curry',
          strIngredient1: 'Chicken',
          strMeasure1: '500g',
          strIngredient2: 'Curry Powder',
          strMeasure2: '2 tbsp',
        }]
      };

      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockCategoryResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockDetailResponse,
        });

      const result = await fetchRecipeByCategories(['Chicken', 'Vegetarian']);

      expect(fetch).toHaveBeenCalled();
      expect(result.name).toBe('Chicken Curry');
      expect(result.category).toBe('Chicken');
      expect(result.ingredients).toContain('500g Chicken');
    });

    it('retries with different category on failure', async () => {
      // First call to filter.php returns no meals (null)
      // Falls back to fetchRecipe which calls random.php
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ meals: null }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            meals: [{
              idMeal: '789',
              strMeal: 'Random Fallback',
              strMealThumb: 'fallback.jpg',
              strCategory: 'Vegetarian',
              strInstructions: 'Make it',
              strArea: 'Italian',
              strTags: 'Easy',
              strIngredient1: 'Pasta',
              strMeasure1: '200g',
            }]
          }),
        });

      const result = await fetchRecipeByCategories(['Chicken']);

      expect(fetch).toHaveBeenCalledTimes(2);
      expect(result.name).toBe('Random Fallback');
    });

    it('throws error when no categories provided', async () => {
      // Empty categories should fall back to fetchRecipe
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          meals: [{
            idMeal: '999',
            strMeal: 'Random',
            strMealThumb: 'random.jpg',
            strCategory: 'Dessert',
            strInstructions: 'Mix',
            strIngredient1: 'Sugar',
            strMeasure1: '1 cup',
          }]
        }),
      });

      const result = await fetchRecipeByCategories([]);
      expect(result.name).toBe('Random');
    });
  });

  describe('fetchRecipe', () => {
    it('fetches random recipe from any category', async () => {
      const mockApiResponse = {
        meals: [{
          idMeal: '111',
          strMeal: 'Random Meal',
          strMealThumb: 'random.jpg',
          strCategory: 'Beef',
          strInstructions: 'Cook it',
          strArea: 'American',
          strTags: 'Quick',
          strIngredient1: 'Beef',
          strMeasure1: '500g',
        }]
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      });

      const result = await fetchRecipe();

      expect(fetch).toHaveBeenCalledWith(
        'https://www.themealdb.com/api/json/v1/1/random.php'
      );
      expect(result.name).toBe('Random Meal');
      expect(result.category).toBe('Beef');
      expect(result.area).toBe('American');
    });

    it('includes area and tags in response', async () => {
      const mockApiResponse = {
        meals: [{
          idMeal: '222',
          strMeal: 'Test Meal',
          strMealThumb: 'test.jpg',
          strCategory: 'Test',
          strArea: 'Italian',
          strTags: 'Pasta,Quick',
          strInstructions: 'Cook it',
          strIngredient1: 'Pasta',
          strMeasure1: '500g',
        }]
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      });

      const result = await fetchRecipe();

      expect(result.area).toBe('Italian');
      expect(result.tags).toEqual(['Pasta', 'Quick']);
    });
  });
});
