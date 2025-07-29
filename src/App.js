import './App.css';
import { useState } from 'react';
import { FoodList } from './FoodList';

function App() {
  const RECIPE_COUNT = 5;
  const [food, setFood] = useState([]);
  const [loading, setLoading] = useState(false);

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

  const handleRoll = () => {
    setLoading(true);
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
  };

  return (
    <div className="App">
      <header className="App-header">
        FoodRoller
      </header>
      <button className="roll-button" onClick={handleRoll} disabled={loading}>
        {loading ? "Rolling..." : "Roll!"}
      </button>
      <FoodList food={food} loading={loading} />
    </div>
  );
}

export default App;