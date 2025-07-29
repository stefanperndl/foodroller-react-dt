import './App.css';
import { RecipeCard } from './RecipeCard';
import { useEffect, useState } from "react";

export function FoodList() {
  const RECIPE_COUNT = 5; // Change this to configure the number of recipes
  const [food, setFood] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecipe = () =>
      fetch("https://www.themealdb.com/api/json/v1/1/random.php")
        .then((response) => {
          if (!response.ok) throw new Error("Network response was not ok");
          return response.json();
        })
        .then((data) => {
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
        });

    const fetches = Array.from({ length: RECIPE_COUNT }, fetchRecipe);

    Promise.all(fetches)
      .then((recipes) => {
        setFood(recipes);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Fetch error:", error);
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Loading recipes...</p>;
  if (!food.length) return <p>No recipes found.</p>;

  return (
    <div className="food-list">
      {food.map((f, idx) => (
        <RecipeCard key={idx} Food={f} />
      ))}
    </div>
  );
}