import './App.css';
import { useState, useEffect } from 'react';
import { FoodList } from './FoodList';
import { TimeframePicker } from './components/TimeframePicker';

const MEALPLAN_KEY = "mealplan_v1";

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
  const today = new Date();
  const defaultEnd = new Date();
  defaultEnd.setDate(today.getDate() + 4);

  const [startDate, setStartDate] = useState(today.toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(defaultEnd.toISOString().slice(0, 10));
  const [food, setFood] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mealplan, setMealplan] = useState({});
  const [mealplanLoaded, setMealplanLoaded] = useState(false); // NEW

  // Load mealplan from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(MEALPLAN_KEY);
    if (stored) setMealplan(JSON.parse(stored));
    setMealplanLoaded(true); // NEW
  }, []);

  // Save mealplan to localStorage on change
  useEffect(() => {
    if (mealplanLoaded) {
      localStorage.setItem(MEALPLAN_KEY, JSON.stringify(mealplan));
    }
  }, [mealplan, mealplanLoaded]);

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

  // Roll recipes for all days in range, but keep saved ones unless confirmed
  const handleRoll = async () => {
    const dates = getDatesInRange(new Date(startDate), new Date(endDate));
    const newFood = [];
    for (let dateObj of dates) {
      const dateStr = dateObj.toISOString().slice(0, 10);
      if (mealplan[dateStr]) {
        // Already saved, skip re-rolling
        newFood.push({ ...mealplan[dateStr], date: dateStr, saved: true });
      } else {
        const recipe = await fetchRecipe();
        newFood.push({ ...recipe, date: dateStr, saved: false });
      }
    }
    setFood(newFood);
    setLoading(false);
  };

  // Save a day's recipe to the mealplan
  const handleSave = (date, recipe) => {
    setMealplan(prev => ({
      ...prev,
      [date]: recipe
    }));
    setFood(prev =>
      prev.map(f => f.date === date ? { ...f, saved: true } : f)
    );
  };

  // Confirm before re-rolling a saved day
  const handleReroll = async (date) => {
    if (mealplan[date]) {
      if (!window.confirm("This day is saved. Re-rolling will overwrite it. Continue?")) return;
      // Remove from mealplan
      setMealplan(prev => {
        const copy = { ...prev };
        delete copy[date];
        return copy;
      });
    }
    // Fetch new recipe for this day
    setLoading(true);
    const recipe = await fetchRecipe();
    setFood(prev =>
      prev.map(f => f.date === date ? { ...recipe, date, saved: false } : f)
    );
    setLoading(false);
  };

  // On mount or timeframe change, load mealplan for those days
  useEffect(() => {
    if (!mealplanLoaded) return; // Only run after mealplan is loaded
    const dates = getDatesInRange(new Date(startDate), new Date(endDate));
    const loaded = dates.map(dateObj => {
      const dateStr = dateObj.toISOString().slice(0, 10);
      if (mealplan[dateStr]) {
        return { ...mealplan[dateStr], date: dateStr, saved: true };
      }
      return { date: dateStr, saved: false };
    });
    setFood(loaded);
    // eslint-disable-next-line
  }, [startDate, endDate, mealplan, mealplanLoaded]);

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
      <FoodList
        food={food}
        loading={loading}
        onSave={handleSave}
        onReroll={handleReroll}
      />
    </div>
  );
}

export default App;