import './App.css';
import { useState, useEffect } from 'react';
import { FoodList } from './components/FoodList';
import { TimeframePicker } from './components/TimeframePicker';
import { getDatesInRange } from './utils/utils';
import { fetchRecipe } from './api/recipes';
import { useMealplan } from './hooks/useMealplan';
import { ShoppingCart } from './components/ShoppingCart';


function App() {
  const today = new Date();
  const defaultEnd = new Date();
  defaultEnd.setDate(today.getDate() + 4);

  const [startDate, setStartDate] = useState(today.toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(defaultEnd.toISOString().slice(0, 10));
  const [food, setFood] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mealplan, setMealplan, mealplanLoaded] = useMealplan();
  const [showCart, setShowCart] = useState(false);


  // Only build empty food slots when timeframe changes
  useEffect(() => {
    if (!mealplanLoaded) return;
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
  }, [startDate, endDate, mealplanLoaded]); // <-- mealplan removed from deps

  // Roll recipes for all days in range, but keep saved ones unless confirmed
  const handleRoll = async () => {
    setLoading(true);
    const dates = getDatesInRange(new Date(startDate), new Date(endDate));
    const newFood = [];
    for (let dateObj of dates) {
      const dateStr = dateObj.toISOString().slice(0, 10);
      if (mealplan[dateStr]) {
        newFood.push({ ...mealplan[dateStr], date: dateStr, saved: true });
      } else {
        const recipe = await fetchRecipe();
        newFood.push({ ...recipe, date: dateStr, saved: false });
      }
    }
    setFood(newFood);
    setLoading(false);
  };

  const handleSave = (date, recipe) => {
    setMealplan(prev => ({
      ...prev,
      [date]: recipe
    }));
    setFood(prev =>
      prev.map(f => f.date === date ? { ...f, saved: true } : f)
    );
  };

  const handleReroll = async (date) => {
    if (mealplan[date]) {
      if (!window.confirm("This day is saved. Re-rolling will overwrite it. Continue?")) return;
      setMealplan(prev => {
        const copy = { ...prev };
        delete copy[date];
        return copy;
      });
    }
    setLoading(true);
    const recipe = await fetchRecipe();
    setFood(prev =>
      prev.map(f => f.date === date ? { ...recipe, date, saved: false } : f)
    );
    setLoading(false);
  };

  // In App.js
const getIngredientsByRecipe = () => {
  // Only include saved meals
  const result = {};
  Object.entries(mealplan).forEach(([date, recipe]) => {
    console.log(recipe);
    result[date] = {
      name: recipe.name,
      ingredients: recipe.ingredients || [],
    };
  });
  return result;
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
        <div className="navbar-cart" onClick={() => setShowCart(true)} title="Show shopping list">
          {/* SVG cart icon */}
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-1.99.9-1.99 2S15.9 22 17 22s2-.9 2-2-.9-2-2-2zM7.16 14l.84-2h7.45c.75 0 1.41-.41 1.75-1.03l3.24-5.88A1 1 0 0 0 19.45 4H5.21l-.94-2H1v2h2l3.6 7.59-1.35 2.44C4.52 15.37 5.48 17 7 17h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12z" fill="#fff"/>
          </svg>
        </div>
      </header>
      {showCart ? (
        <ShoppingCart
          ingredientsByRecipe={getIngredientsByRecipe()}
          onClose={() => setShowCart(false)}
        />
      ) : (
        <>
          <button className="roll-button" onClick={handleRoll} disabled={loading}>
            {loading ? "Rolling..." : "Roll!"}
          </button>
          <FoodList
            food={food}
            loading={loading}
            onSave={handleSave}
            onReroll={handleReroll}
          />
        </>
      )}
    </div>
  );
}

export default App;