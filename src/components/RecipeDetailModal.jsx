import { useState, useEffect } from 'react';
import { fetchMealById } from '../api/recipes';
import { getMatchingDietaryRestrictions } from '../utils/dietaryRestrictions';

export default function RecipeDetailModal({ meal, onClose, onAddToDate }) {
  const [fullRecipe, setFullRecipe] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadFullDetails() {
      // If meal already has ingredients (full recipe), use it directly
      if (meal.ingredients && meal.instructions) {
        setFullRecipe(meal);
        return;
      }

      // Otherwise, fetch full details
      setLoading(true);
      setError(null);
      try {
        const details = await fetchMealById(meal.id);
        setFullRecipe(details);
      } catch (err) {
        console.error('Error loading recipe details:', err);
        setError('Failed to load recipe details. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    loadFullDetails();
  }, [meal]);

  return (
    <div className="modal-overlay" data-testid="modal-overlay" onClick={onClose}>
      <div className="modal-content recipe-detail-modal" data-testid="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close">
          ×
        </button>

        {loading && (
          <div className="recipe-detail-loading">
            Loading recipe details...
          </div>
        )}

        {error && (
          <div className="recipe-detail-error">
            {error}
          </div>
        )}

        {fullRecipe && (
          <>
            <div className="recipe-detail-header">
              <img 
                src={fullRecipe.image} 
                alt={fullRecipe.name}
                className="recipe-detail-image"
              />
              <div className="recipe-detail-title-section">
                <h2 className="recipe-detail-title">{fullRecipe.name}</h2>
                <div className="recipe-meta-tags">
                  {/* Dietary restriction badges - most prominent */}
                  {getMatchingDietaryRestrictions(fullRecipe).map((diet) => (
                    <span key={diet.key} className="recipe-meta-tag recipe-meta-dietary">
                      {diet.icon} {diet.name}
                    </span>
                  ))}
                  
                  {/* Category and cuisine */}
                  {fullRecipe.category && (
                    <span className="recipe-meta-tag">{fullRecipe.category}</span>
                  )}
                  {fullRecipe.area && (
                    <span className="recipe-meta-tag recipe-meta-cuisine">{fullRecipe.area}</span>
                  )}
                  
                  {/* Cooking time (if available - not in free API) */}
                  {fullRecipe.cookTime && (
                    <span className="recipe-meta-tag recipe-meta-time">
                      🕐 {fullRecipe.cookTime}
                    </span>
                  )}
                  
                  {/* Recipe tags - more subtle */}
                  {fullRecipe.tags && fullRecipe.tags.length > 0 && fullRecipe.tags.map((tag, idx) => (
                    <span key={idx} className="recipe-meta-tag recipe-meta-tag-secondary">{tag}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="recipe-detail-body">
              <div className="recipe-detail-section">
                <h3>Ingredients</h3>
                <ul className="recipe-ingredients-list">
                  {fullRecipe.ingredients && fullRecipe.ingredients.map((ingredient, idx) => (
                    <li key={idx}>{ingredient}</li>
                  ))}
                </ul>
              </div>

              <div className="recipe-detail-section">
                <h3>Instructions</h3>
                <p className="recipe-instructions-text">
                  {fullRecipe.instructions}
                </p>
              </div>
            </div>

            <div className="recipe-detail-footer">
              <button 
                className="btn btn-secondary" 
                onClick={onClose}
              >
                Close
              </button>
              {onAddToDate && (
                <button 
                  className="btn btn-primary" 
                  onClick={() => onAddToDate(fullRecipe)}
                >
                  Add to Date
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
