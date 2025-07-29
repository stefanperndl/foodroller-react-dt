import './App.css';
import { RecipeCard } from './components/RecipeCard';

export function FoodList({ food, loading }) {
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
        </div>
      ))}
    </div>
  );
}