import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { fetchMealById } from '../api/recipes';
import { getMatchingDietaryRestrictions } from '../utils/dietaryRestrictions';
import { useNutrition } from '../hooks/useNutrition';
import { DEFAULT_SERVINGS } from '../api/nutrition';
import { useAuth } from '../context/AuthContext';

export default function RecipeDetailModal({ meal, onClose, onAddToDate, onFork }) {
  const { user } = useAuth();
  const [fullRecipe, setFullRecipe] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [servings, setServings] = useState(DEFAULT_SERVINGS);
  const { nutrition, loading: nutritionLoading } = useNutrition(fullRecipe);

  const per = (val) => Math.round(val / servings);

  useEffect(() => {
    async function load() {
      if (meal.ingredients && meal.instructions) { setFullRecipe(meal); return; }
      setLoading(true);
      setError(null);
      try { setFullRecipe(await fetchMealById(meal.id)); }
      catch { setError('Failed to load recipe details.'); }
      finally { setLoading(false); }
    }
    load();
  }, [meal]);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="modal-overlay" data-testid="modal-overlay" onClick={onClose}>
      <div className="modal recipe-detail-modal" data-testid="modal-content" onClick={(e) => e.stopPropagation()}>
        {loading && <div className="recipe-detail-loading">Loading…</div>}
        {error   && <div className="recipe-detail-error">{error}</div>}
        {fullRecipe && (
          <>
            <div className="modal__hero">
              <img src={fullRecipe.image} alt={fullRecipe.name} />
              <div className="modal__hero-overlay">
                <div className="modal__hero-tags">
                  {fullRecipe.category && <span className="modal__hero-tag">{fullRecipe.category}</span>}
                  {fullRecipe.area    && <span className="modal__hero-tag">{fullRecipe.area}</span>}
                  {getMatchingDietaryRestrictions(fullRecipe).map((d) => (
                    <span key={d.key} className="modal__hero-tag">{d.icon} {d.name}</span>
                  ))}
                </div>
                <div className="modal__hero-title">{fullRecipe.name}</div>
              </div>
              <button className="modal__close" onClick={onClose} aria-label="Close">
                <X size={16} strokeWidth={1.75} />
              </button>
            </div>

            <div className="modal__body">
              <div className="modal__left">

                {/* Nutrition */}
                <div className="recipe-nutrition-section">
                  {nutritionLoading && <p className="nutrition-loading">Estimating nutrition…</p>}
                  {nutrition && !nutritionLoading && (
                    <>
                      <div className="recipe-macro-grid">
                        <div className="recipe-macro-pill recipe-macro-pill--kcal">
                          <span className="recipe-macro-val">{per(nutrition.kcal)}</span>
                          <span className="recipe-macro-lbl">kcal</span>
                        </div>
                        <div className="recipe-macro-pill recipe-macro-pill--protein">
                          <span className="recipe-macro-val">{per(nutrition.protein)}g</span>
                          <span className="recipe-macro-lbl">protein</span>
                        </div>
                        <div className="recipe-macro-pill recipe-macro-pill--carbs">
                          <span className="recipe-macro-val">{per(nutrition.carbs)}g</span>
                          <span className="recipe-macro-lbl">carbs</span>
                        </div>
                        <div className="recipe-macro-pill recipe-macro-pill--fat">
                          <span className="recipe-macro-val">{per(nutrition.fat)}g</span>
                          <span className="recipe-macro-lbl">fat</span>
                        </div>
                      </div>
                      <div className="recipe-servings-row">
                        <span className="recipe-servings-label">Divide by</span>
                        <input
                          type="number"
                          min="1" max="20"
                          value={servings}
                          onChange={(e) => setServings(Math.max(1, Number(e.target.value)))}
                          className="recipe-servings-input"
                          aria-label="Number of portions"
                        />
                        <span className="recipe-servings-label">serving{servings !== 1 ? 's' : ''}</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Ingredients */}
                <div className="modal__section-title">Ingredients</div>
                <ul className="ingredients-list">
                  {fullRecipe.ingredients?.map((ing, i) => (
                    <li key={i} className="ingredient-row">{ing}</li>
                  ))}
                </ul>

                {onAddToDate && (
                  <button className="btn btn--primary" style={{ width: '100%', marginTop: 16 }} onClick={() => onAddToDate(fullRecipe)}>
                    Add to plan
                  </button>
                )}
                {onFork && user && (
                  <button className="btn btn--outline" style={{ width: '100%', marginTop: 8 }} onClick={() => onFork(fullRecipe)}>
                    Fork to My Recipes
                  </button>
                )}
              </div>

              <div className="modal__right">
                <div className="modal__section-title">Instructions</div>
                <div className="instructions-text">{fullRecipe.instructions}</div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
