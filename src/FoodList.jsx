import './App.css';
import { RecipeCard } from './RecipeCard';

export function FoodList({ food, loading }) {
  if (loading) return <p>Loading recipes...</p>;
  if (!food || food.length === 0) return null;

  return (
    <div className="food-list">
      {food.map((f, idx) => (
        <RecipeCard key={idx} Food={f} />
      ))}
    </div>
  );
}