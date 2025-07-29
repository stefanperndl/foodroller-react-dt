import './App.css';
import { RecipeCard } from './components/RecipeCard';
import { useState } from 'react';

export function FoodList({ food, loading, onSave, onReroll }) {
  const [justSaved, setJustSaved] = useState(null);

  const handleSave = (date, recipe) => {
    onSave(date, recipe);

  };

  if (loading) return <p>Loading recipes...</p>;
  if (!food || food.length === 0) return null;

  return (
    <div className="food-list">
      {food.map((f, idx) => (
        <div key={idx} className="recipe-tile">
          <div className="recipe-tile-content">
            <div className="recipe-tile-date">{f.date}</div>
            <RecipeCard Food={f} />
            {f.saved && justSaved === f.date && (
              <span style={{ color: 'green', marginLeft: 8 }}>Saved</span>
            )}
          </div>
          {f.name && (
            <div className="tile-bottom-bar">
              <button
                type="button" 
                className={
                  f.saved
                    ? "reroll-button reroll-button-black"
                    : "reroll-button"
                }
                onClick={() =>
                  f.saved
                    ? onReroll(f.date)
                    : handleSave(f.date, f)
                }
              >
                {f.saved ? "Re-roll" : "Save"}
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}