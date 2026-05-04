'use client';
import { useState } from 'react';
import { useMacroContext } from '../context/MacroContext';
import { useAuth } from '../context/AuthContext';

export default function MyRecipesView({ onOpenCreate, onOpenEdit }) {
  const { customRecipes, deleteRecipe } = useMacroContext();
  const { user } = useAuth();
  const [confirmDelete, setConfirmDelete] = useState(null);

  if (!user) {
    return (
      <div className="my-recipes-view">
        <div className="my-recipes-empty">
          <p>Sign in to create and manage your own recipes.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="my-recipes-view">
      <div className="my-recipes-header">
        <h2>My Recipes</h2>
        <button className="btn btn--primary" onClick={onOpenCreate}>
          + New Recipe
        </button>
      </div>

      {!customRecipes.length ? (
        <div className="my-recipes-empty">
          <p>No recipes yet. Create your first or fork one from Browse.</p>
        </div>
      ) : (
        <div className="my-recipes-grid">
          {customRecipes.map((r) => (
            <div key={r.id} className="my-recipe-card">
              {r.image
                ? <img src={r.image} alt={r.name} className="my-recipe-card__img" />
                : <div className="my-recipe-card__img-placeholder">🍽️</div>
              }
              <div className="my-recipe-card__body">
                <span className="my-recipe-card__badge">
                  {r.source === 'fork' ? 'Fork' : 'Custom'}
                </span>
                <p className="my-recipe-card__name">{r.name}</p>
                {r.category && <p className="my-recipe-card__meta">{r.category}</p>}
                {r.nutrition && (
                  <p className="my-recipe-card__nutrition">
                    {Math.round(r.nutrition.kcal / (r.servings ?? 4))} kcal ·{' '}
                    {Math.round(r.nutrition.protein / (r.servings ?? 4))}g P
                  </p>
                )}
              </div>
              <div className="my-recipe-card__actions">
                <button onClick={() => onOpenEdit(r)}>Edit</button>
                <button
                  className="btn-danger"
                  onClick={() => setConfirmDelete(r.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal modal--sm" onClick={(e) => e.stopPropagation()}>
            <p style={{ margin: '0 0 16px' }}>Delete this recipe?</p>
            <div className="modal-actions">
              <button className="btn btn--outline" onClick={() => setConfirmDelete(null)}>
                Cancel
              </button>
              <button
                className="btn btn--primary"
                style={{ background: '#dc2626' }}
                onClick={() => { deleteRecipe(confirmDelete); setConfirmDelete(null); }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
