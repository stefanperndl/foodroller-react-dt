import { Heart } from 'lucide-react';
import { useMacroContext } from '../context/MacroContext';

export function RecipeCard({ Food, onClick }) {
  const { isFavorite, addFavorite, removeFavorite } = useMacroContext();

  if (!Food || !Food.name) return null;
  const faved = isFavorite(Food.id);

  function toggleFavorite(e) {
    e.stopPropagation();
    faved ? removeFavorite(Food.id) : addFavorite(Food);
  }

  return (
    <div
      className="recipe-card"
      data-testid="recipe-card"
      onClick={() => onClick?.(Food)}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className="recipe-card__img">
        <img src={Food.image} alt={Food.name} loading="lazy" />
        {Food.category && <span className="recipe-card__cat">{Food.category}</span>}
        {Food.isStock && <span className="recipe-card__badge">Curated</span>}
        <button
          className={`recipe-card__fav${faved ? ' recipe-card__fav--active' : ''}`}
          onClick={toggleFavorite}
          aria-label={faved ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart size={14} strokeWidth={2} fill={faved ? 'currentColor' : 'none'} />
        </button>
      </div>
      <div className="recipe-card__body">
        <div className="recipe-card__name">{Food.name}</div>
      </div>
    </div>
  );
}
