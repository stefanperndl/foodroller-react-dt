import { useState, useEffect } from 'react';
import { RecipeCard } from './RecipeCard';
import { fetchMealsByCategory } from '../api/recipes';
import { validateMealAgainstRestrictions } from '../utils/dietaryRestrictions';
import RecipeDetailModal from './RecipeDetailModal';

export default function RecipeBrowser({
  categories,
  selectedCategories,
  selectedRestrictions,
  onAddToDate
}) {
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedMeal, setSelectedMeal] = useState(null);

  useEffect(() => {
    async function loadMeals() {
      setLoading(true);
      setError(null);

      try {
        const categoriesToFetch = selectedCategories.length > 0
          ? selectedCategories
          : categories;

        const promises = categoriesToFetch.map(cat => fetchMealsByCategory(cat));
        const results = await Promise.all(promises);

        let allMeals = results.flat();

        if (selectedRestrictions.length > 0) {
          allMeals = allMeals.filter(meal =>
            validateMealAgainstRestrictions(
              { category: meal.category, ingredients: [] },
              selectedRestrictions
            )
          );
        }

        setMeals(allMeals);
      } catch (err) {
        console.error('Error loading meals:', err);
        setError('Failed to load recipes. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    loadMeals();
  }, [categories, selectedCategories, selectedRestrictions]);

  if (loading) {
    return <div className="recipe-browser-loading">Loading recipes...</div>;
  }

  if (error) {
    return <div className="recipe-browser-error">{error}</div>;
  }

  if (meals.length === 0) {
    return (
      <div className="recipe-browser-empty">
        No recipes found. Try selecting different categories or dietary restrictions.
      </div>
    );
  }

  return (
    <div className="recipe-browser">
      <div className="browse-header">
        <h2>Browse Recipes</h2>
        <span className="browse-count">{meals.length} recipes found</span>
      </div>

      <div className="browse-grid">
        {meals.map(meal => (
          <div key={meal.id} className="recipe-browser-item">
            <RecipeCard Food={meal} onClick={() => setSelectedMeal(meal)} />
            <button
              className="btn btn--sm btn--primary"
              style={{ width: '100%' }}
              onClick={() => onAddToDate(meal)}
            >
              Add to Date
            </button>
          </div>
        ))}
      </div>

      {selectedMeal && (
        <RecipeDetailModal
          meal={selectedMeal}
          onClose={() => setSelectedMeal(null)}
          onAddToDate={(recipe) => {
            setSelectedMeal(null);
            onAddToDate(recipe);
          }}
        />
      )}
    </div>
  );
}
