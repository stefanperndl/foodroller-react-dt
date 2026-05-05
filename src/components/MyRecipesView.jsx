'use client';
import { useState } from 'react';
import { Heart } from 'lucide-react';
import { useMacroContext } from '../context/MacroContext';
import { useAuth } from '../context/AuthContext';
import RecipeDetailModal from './RecipeDetailModal';

export default function MyRecipesView({ onOpenCreate, onOpenEdit, onAddToDate, onFork }) {
  const { customRecipes, deleteRecipe, favorites, removeFavorite } = useMacroContext();
  const { user } = useAuth();
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [tab, setTab] = useState('mine');
  const [selectedRecipe, setSelectedRecipe] = useState(null);

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
        <div className="my-recipes-tabs">
          <button className={tab === 'mine' ? 'active' : ''} onClick={() => setTab('mine')}>
            My Recipes {customRecipes.length > 0 && <span className="my-recipes-tab-count">{customRecipes.length}</span>}
          </button>
          <button className={tab === 'liked' ? 'active' : ''} onClick={() => setTab('liked')}>
            <Heart size={13} strokeWidth={2} /> Liked {favorites.length > 0 && <span className="my-recipes-tab-count">{favorites.length}</span>}
          </button>
        </div>
        {tab === 'mine' && (
          <button className="btn btn--primary" onClick={onOpenCreate}>+ New Recipe</button>
        )}
      </div>

      {tab === 'mine' && (
        <>
          {!customRecipes.length ? (
            <div className="my-recipes-empty">
              <p>No recipes yet. Create your first or fork one from Browse.</p>
            </div>
          ) : (
            <div className="my-recipes-grid">
              {customRecipes.map((r) => (
                <div key={r.id} className="my-recipe-card" onClick={() => setSelectedRecipe(r)} style={{ cursor: 'pointer' }}>
                  {r.image
                    ? <img src={r.image} alt={r.name} className="my-recipe-card__img" />
                    : <div className="my-recipe-card__img-placeholder">🍽️</div>
                  }
                  <div className="my-recipe-card__body">
                    <span className="my-recipe-card__badge">{r.source === 'fork' ? 'Fork' : 'Custom'}</span>
                    <p className="my-recipe-card__name">{r.name}</p>
                    {r.category && <p className="my-recipe-card__meta">{r.category}</p>}
                    {r.nutrition && (
                      <p className="my-recipe-card__nutrition">
                        {Math.round(r.nutrition.kcal / (r.servings ?? 4))} kcal ·{' '}
                        {Math.round(r.nutrition.protein / (r.servings ?? 4))}g P
                      </p>
                    )}
                  </div>
                  <div className="my-recipe-card__actions" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => onOpenEdit(r)}>Edit</button>
                    <button className="btn-danger" onClick={() => setConfirmDelete(r.id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'liked' && (
        <>
          {!favorites.length ? (
            <div className="my-recipes-empty">
              <p>No liked recipes yet. Swipe right in Discover to save recipes here.</p>
            </div>
          ) : (
            <div className="my-recipes-grid">
              {favorites.map((r) => (
                <div key={r.id} className="my-recipe-card" onClick={() => setSelectedRecipe(r)} style={{ cursor: 'pointer' }}>
                  {r.image
                    ? <img src={r.image} alt={r.name} className="my-recipe-card__img" />
                    : <div className="my-recipe-card__img-placeholder">🍽️</div>
                  }
                  <div className="my-recipe-card__body">
                    <span className="my-recipe-card__badge my-recipe-card__badge--liked">
                      <Heart size={10} strokeWidth={2} fill="currentColor" /> Liked
                    </span>
                    <p className="my-recipe-card__name">{r.name}</p>
                    {r.category && <p className="my-recipe-card__meta">{r.category}</p>}
                  </div>
                  <div className="my-recipe-card__actions" onClick={(e) => e.stopPropagation()}>
                    <button className="btn-danger" onClick={() => removeFavorite(r.id)}>Unlike</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {selectedRecipe && (
        <RecipeDetailModal
          meal={selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
          onAddToDate={onAddToDate}
          onFork={onFork}
        />
      )}

      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal modal--sm" onClick={(e) => e.stopPropagation()}>
            <p style={{ margin: '0 0 16px' }}>Delete this recipe?</p>
            <div className="modal-actions">
              <button className="btn btn--outline" onClick={() => setConfirmDelete(null)}>Cancel</button>
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
