import React, { useState } from 'react';
import { RecipeCard } from "./RecipeCard";
import RecipeDetailModal from "./RecipeDetailModal";

export function FoodList({ food, loading, onSave, onReroll }) {
  const [selectedMeal, setSelectedMeal] = useState(null);

  const handleSave = (date, recipe) => {
    onSave(date, recipe);
  };

  if (loading) return <p>Loading recipes...</p>;
  if (!food || food.length === 0) return null;

  return (
    <>
      <div className="food-list-grid">
        {food.map((f, idx) => (
          <div key={idx} className="recipe-tile">
            <div className="recipe-tile-content">
              <div className="recipe-date">{f.date}</div>
              <RecipeCard 
                Food={f} 
                onClick={f.name ? () => setSelectedMeal(f) : undefined}
              />
              {f.saved === f.date && (
                <span className="recipe-saved-badge">Saved</span>
              )}
            </div>
            {f.name && (
              <div className="tile-bottom-bar">
                <button
                  type="button"
                  className={f.saved ? "btn btn-reroll" : "btn btn-save"}
                  onClick={() => (f.saved ? onReroll(f.date) : handleSave(f.date, f))}
                >
                  {f.saved ? "Re-roll" : "Save"}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {selectedMeal && (
        <RecipeDetailModal
          meal={selectedMeal}
          onClose={() => setSelectedMeal(null)}
          onAddToDate={null}
        />
      )}
    </>
  );
}
