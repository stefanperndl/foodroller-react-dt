// Fetch meals from specific categories
// TODO: When upgrading to Premium API, refactor this to support true multi-category filtering
// Premium API supports: filter.php?c=Seafood,Beef,Chicken (comma-separated categories)
// Current implementation: randomly picks ONE category from selection (free API limitation)
export async function fetchRecipeByCategories(categories) {
  // If no categories selected, fall back to random
  if (!categories || categories.length === 0) {
    return fetchRecipe();
  }

  // Pick a random category from the selected ones
  const randomCategory = categories[Math.floor(Math.random() * categories.length)];
  
  // Fetch meals from that category
  const response = await fetch(
    `https://www.themealdb.com/api/json/v1/1/filter.php?c=${encodeURIComponent(randomCategory)}`
  );
  if (!response.ok) throw new Error("Network response was not ok");
  const data = await response.json();
  
  // If no meals found in this category, fall back to random
  if (!data.meals || data.meals.length === 0) {
    return fetchRecipe();
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
  
  return {
    name: meal.strMeal,
    image: meal.strMealThumb,
    ingredients,
    instructions: meal.strInstructions,
    category: meal.strCategory
  };
}

export async function fetchRecipe() {
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
  return {
    name: meal.strMeal,
    image: meal.strMealThumb,
    ingredients,
    instructions: meal.strInstructions,
    category: meal.strCategory
  };
}