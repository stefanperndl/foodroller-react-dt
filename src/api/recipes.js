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
    instructions: meal.strInstructions
  };
}