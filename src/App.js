import './App.css';
import { useState, useEffect } from 'react';
import { FoodList } from './components/FoodList';
import { TimeframePicker } from './components/TimeframePicker';
import { getDatesInRange } from './utils/utils';
import { fetchRecipe } from './api/recipes';
import { useMealplan } from './hooks/useMealplan';

function App() {
  const today = new Date();
  const defaultEnd = new Date();
  defaultEnd.setDate(today.getDate() + 4);

  const [startDate, setStartDate] = useState(today.toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(defaultEnd.toISOString().slice(0, 10));
  const [food, setFood] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mealplan, setMealplan, mealplanLoaded] = useMealplan();

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