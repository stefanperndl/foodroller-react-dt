import './App.css';
import { RecipeCard } from './components/RecipeCard';

export function FoodList({ food, loading, onSave, onReroll }) {
  if (loading) return <p>Loading recipes...</p>;
  if (!food || food.length === 0) return null;

  return (
    <div className="food-list">
      {food.map((f, idx) => (
        <div key={idx} style={{ marginBottom: 24 }}>
          <div style={{ fontWeight: 'bold', marginBottom: 4 }}>
            {f.date}
          </div>
          <RecipeCard Food={f} />
          {!f.saved && f.name && (
            <button onClick={() => onSave(f.date, f)}>Save</button>
          )}
          {f.name && (
            <button onClick={() => onReroll(f.date)}>Re-roll</button>
          )}
          {f.saved && <span style={{ color: 'green', marginLeft: 8 }}>Saved</span>}
        </div>
      ))}
    </div>
  );
}