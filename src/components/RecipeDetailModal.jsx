import { useState, useEffect } from 'react';
import { fetchMealById } from '../api/recipes';
import { getMatchingDietaryRestrictions } from '../utils/dietaryRestrictions';
import { useNutrition } from '../hooks/useNutrition';

export default function RecipeDetailModal({ meal, onClose, onAddToDate }) {
  const [fullRecipe, setFullRecipe] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [servings, setServings] = useState(4);
  const { nutrition, loading: nutritionLoading } = useNutrition(fullRecipe);

  const per = (val) => Math.round(val / servings);

  useEffect(() => {
    async function loadFullDetails() {
      if (meal.ingredients && meal.instructions) {
        setFullRecipe(meal);
        return;
      }
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

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="modal-overlay" data-testid="modal-overlay" onClick={onClose}>
      <div className="modal recipe-detail-modal" data-testid="modal-content" onClick={(e) => e.stopPropagation()}>
        {loading && (
          <div className="recipe-detail-loading" style={{ padding: 40, textAlign: 'center' }}>
            Loading recipe details...
          </div>
        )}
        {error && (
          <div className="recipe-detail-error" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
            {error}
          </div>
        )}
        {fullRecipe && (
          <>
            <div className="modal__hero">
              <img src={fullRecipe.image} alt={fullRecipe.name} />
              <div className="modal__hero-overlay">
                <div className="modal__hero-tags">
                  {fullRecipe.category && (
                    <span className="modal__hero-tag">{fullRecipe.category}</span>
                  )}
                  {fullRecipe.area && (
                    <span className="modal__hero-tag">{fullRecipe.area}</span>
                  )}
                  {getMatchingDietaryRestrictions(fullRecipe).map((diet) => (
                    <span key={diet.key} className="modal__hero-tag">
                      {diet.icon} {diet.name}
                    </span>
                  ))}
                </div>
                <div className="modal__hero-title">{fullRecipe.name}</div>
              </div>
              <button className="modal__close" onClick={onClose} aria-label="Close">✕</button>
            </div>

            <div className="modal__body">
              <div className="modal__left">
                <div className="recipe-macros" aria-label="Nutrition per serving">
                  {nutritionLoading && <span className="macro-loading">Loading nutrition…</span>}
                  {nutrition && !nutritionLoading && (
                    <>
                      <div className="macro-servings">
                        <button className="servings-btn" onClick={() => setServings(s => Math.max(1, s - 1))} aria-label="Fewer servings">−</button>
                        <span className="servings-label">{servings} serving{servings !== 1 ? 's' : ''}</span>
                        <button className="servings-btn" onClick={() => setServings(s => Math.min(20, s + 1))} aria-label="More servings">+</button>
                      </div>
                      <div className="macro-item">
                        <span className="macro-value">{per(nutrition.kcal)}</span>
                        <span className="macro-label">kcal</span>
                      </div>
                      <div className="macro-item macro-protein">
                        <span className="macro-value">{per(nutrition.protein)}g</span>
                        <span className="macro-label">protein</span>
                      </div>
                      <div className="macro-item macro-carbs">
                        <span className="macro-value">{per(nutrition.carbs)}g</span>
                        <span className="macro-label">carbs</span>
                      </div>
                      <div className="macro-item macro-fat">
                        <span className="macro-value">{per(nutrition.fat)}g</span>
                        <span className="macro-label">fat</span>
                      </div>
                    </>
                  )}
                </div>

                <div className="modal__section-title">Ingredients</div>
                <ul className="recipe-ingredients-list ingredients-list">
                  {fullRecipe.ingredients && fullRecipe.ingredients.map((ingredient, idx) => (
                    <li key={idx} className="ingredient-row">{ingredient}</li>
                  ))}
                </ul>

                {onAddToDate && (
                  <button
                    className="btn btn--primary"
                    style={{ width: '100%', marginTop: 16 }}
                    onClick={() => onAddToDate(fullRecipe)}
                  >
                    Add to Date
                  </button>
                )}
              </div>

              <div className="modal__right">
                <div className="modal__section-title">Instructions</div>
                <div className="instructions-text recipe-instructions-text">
                  {fullRecipe.instructions}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
