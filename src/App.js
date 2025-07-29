import './App.css';
import { useState } from 'react';
import { FoodList } from './FoodList';
import { TimeframePicker } from './components/TimeframePicker';

function getDatesInRange(start, end) {
  const dates = [];
  let current = new Date(start);
  while (current <= end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

function App() {
  // Default: today to today+4
  const today = new Date();
  const defaultEnd = new Date();
  defaultEnd.setDate(today.getDate() + 4);

  const [startDate, setStartDate] = useState(today.toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(defaultEnd.toISOString().slice(0, 10));
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
    const dates = getDatesInRange(new Date(startDate), new Date(endDate));
    const fetches = dates.map(fetchRecipe);
    Promise.all(fetches)
      .then((recipes) => {
        // Attach date to each recipe
        const foodWithDates = recipes.map((recipe, idx) => ({
          ...recipe,
          date: dates[idx].toISOString().slice(0, 10)
        }));
        setFood(foodWithDates);
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
        <TimeframePicker
          startDate={startDate}
          endDate={endDate}
          onStartChange={setStartDate}
          onEndChange={setEndDate}
          disabled={loading}
        />
      </header>
      <button className="roll-button" onClick={handleRoll} disabled={loading}>
        {loading ? "Rolling..." : "Roll!"}
      </button>
      <FoodList food={food} loading={loading} />
    </div>
  );
}

export default App;