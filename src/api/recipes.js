import { validateMealAgainstRestrictions, DIETARY_RESTRICTIONS } from '../utils/dietaryRestrictions';

// Browse/Catalog API functions

/**
 * Fetch a list of meals by category (for browsing)
 * Returns lightweight meal objects with id, name, and thumbnail
 * @param {string} category - Category name (e.g., "Seafood", "Beef")
 * @returns {Promise<Array>} Array of {id, name, image, category}
 */
export async function fetchMealsByCategory(category) {
  const response = await fetch(
    `https://www.themealdb.com/api/json/v1/1/filter.php?c=${encodeURIComponent(category)}`
  );
  if (!response.ok) throw new Error("Network response was not ok");
  const data = await response.json();
  
  if (!data.meals) return [];
  
  // Transform to our format
  return data.meals.map(meal => ({
    id: meal.idMeal,
    name: meal.strMeal,
    image: meal.strMealThumb,
    category: category
  }));
}

/**
 * Fetch full details for a specific meal by ID
 * @param {string} mealId - Meal ID from TheMealDB
 * @returns {Promise<Object>} Full recipe object
 */
export async function fetchMealById(mealId) {
  const response = await fetch(
    `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${mealId}`
  );
  if (!response.ok) throw new Error("Network response was not ok");
  const data = await response.json();
  
  if (!data.meals || data.meals.length === 0) {
    throw new Error("Meal not found");
  }
  
  const meal = data.meals[0];
  const ingredients = [];
  for (let i = 1; i <= 20; i++) {
    const ingredient = meal[`strIngredient${i}`];
    const measure = meal[`strMeasure${i}`];
    if (ingredient && ingredient.trim()) {
      ingredients.push(`${measure.trim()} ${ingredient.trim()}`);
    }
  }
  
  return {
    id: meal.idMeal,
    name: meal.strMeal,
    image: meal.strMealThumb,
    ingredients,
    instructions: meal.strInstructions,
    category: meal.strCategory,
    area: meal.strArea || null,
    tags: meal.strTags ? meal.strTags.split(',').map(tag => tag.trim()) : []
  };
}

// Fetch meals from specific categories
// TODO: When upgrading to Premium API, refactor this to support true multi-category filtering
// Premium API supports: filter.php?c=Seafood,Beef,Chicken (comma-separated categories)
// Current implementation: randomly picks ONE category from selection (free API limitation)
export async function fetchRecipeByCategories(categories, dietaryRestrictions = [], maxRetries = 5) {
  // Get list of excluded categories based on dietary restrictions
  const excludedCategories = new Set();
  if (dietaryRestrictions && dietaryRestrictions.length > 0) {
    dietaryRestrictions.forEach(restrictionKey => {
      const restriction = DIETARY_RESTRICTIONS[restrictionKey];
      if (restriction && restriction.excludeCategories) {
        restriction.excludeCategories.forEach(cat => excludedCategories.add(cat));
      }
    });
  }

  // Filter out excluded categories from the selection
  let availableCategories = categories;
  if (excludedCategories.size > 0 && categories && categories.length > 0) {
    availableCategories = categories.filter(cat => !excludedCategories.has(cat));
  }

  // If no categories selected or all are excluded, fall back to random with validation
  if (!availableCategories || availableCategories.length === 0) {
    return fetchRecipe(dietaryRestrictions, maxRetries);
  }

  // Pick a random category from the available ones (not excluded)
  const randomCategory = availableCategories[Math.floor(Math.random() * availableCategories.length)];
  
  // Fetch meals from that category
  const response = await fetch(
    `https://www.themealdb.com/api/json/v1/1/filter.php?c=${encodeURIComponent(randomCategory)}`
  );
  if (!response.ok) throw new Error("Network response was not ok");
  const data = await response.json();
  
  // If no meals found in this category, fall back to random
  if (!data.meals || data.meals.length === 0) {
    return fetchRecipe(dietaryRestrictions, maxRetries);
  }
  
  // Pick a random meal from the category
  const randomMeal = data.meals[Math.floor(Math.random() * data.meals.length)];
  
  // Fetch full details for that meal
  const detailsResponse = await fetch(
    `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${randomMeal.idMeal}`
  );
  if (!detailsResponse.ok) throw new Error("Network response was not ok");
  const detailsData = await detailsResponse.json();
  const meal = detailsData.meals[0];
  
  const ingredients = [];
  for (let i = 1; i <= 20; i++) {
    const ingredient = meal[`strIngredient${i}`];
    const measure = meal[`strMeasure${i}`];
    if (ingredient && ingredient.trim()) {
      ingredients.push(`${measure.trim()} ${ingredient.trim()}`);
    }
  }
  
  const recipe = {
    name: meal.strMeal,
    image: meal.strMealThumb,
    ingredients,
    instructions: meal.strInstructions,
    category: meal.strCategory,
    area: meal.strArea || null,
    tags: meal.strTags ? meal.strTags.split(',').map(tag => tag.trim()) : []
  };

  // Validate against dietary restrictions
  if (dietaryRestrictions && dietaryRestrictions.length > 0) {
    const isValid = validateMealAgainstRestrictions(recipe, dietaryRestrictions);
    
    if (!isValid && maxRetries > 0) {
      // Meal doesn't meet restrictions, try again
      return fetchRecipeByCategories(categories, dietaryRestrictions, maxRetries - 1);
    }
  }

  return recipe;
}

export async function fetchRecipe(dietaryRestrictions = [], maxRetries = 5) {
  const response = await fetch("https://www.themealdb.com/api/json/v1/1/random.php");
  if (!response.ok) throw new Error("Network response was not ok");
  const data = await response.json();
  const meal = data.meals[0];
  const ingredients = [];
  for (let i = 1; i <= 20; i++) {
    const ingredient = meal[`strIngredient${i}`];
    const measure = meal[`strMeasure${i}`];
    if (ingredient && ingredient.trim()) {
      ingredients.push(`${measure.trim()} ${ingredient.trim()}`);
    }
  }
  
  const recipe = {
    name: meal.strMeal,
    image: meal.strMealThumb,
    ingredients,
    instructions: meal.strInstructions,
    category: meal.strCategory,
    area: meal.strArea || null,
    tags: meal.strTags ? meal.strTags.split(',').map(tag => tag.trim()) : []
  };

  // Validate against dietary restrictions
  if (dietaryRestrictions && dietaryRestrictions.length > 0) {
    const isValid = validateMealAgainstRestrictions(recipe, dietaryRestrictions);
    
    if (!isValid && maxRetries > 0) {
      // Meal doesn't meet restrictions, try again
      return fetchRecipe(dietaryRestrictions, maxRetries - 1);
    }
  }

  return recipe;
}