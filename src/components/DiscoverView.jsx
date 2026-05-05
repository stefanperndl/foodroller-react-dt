'use client';
import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { Heart, X } from 'lucide-react';
import { useMacroContext } from '../context/MacroContext';
import { useDiscover } from '../hooks/useDiscover';
import RecipeDetailModal from './RecipeDetailModal';
import { fetchMealsByCategory } from '../api/recipes';

const SEED_CATEGORIES = ['Chicken', 'Beef', 'Vegetarian', 'Pasta', 'Seafood'];

const THRESHOLD = 90;

function SwipeCard({ recipe, onLike, onDismiss, onOpen, isTop }) {
  const offsetRef = useRef(0);
  const [offset, setOffset] = useState(0);
  const dragRef = useRef({ active: false, startX: 0, startY: 0 });

  const onPointerDown = useCallback((e) => {
    if (!isTop) return;
    dragRef.current = { active: true, startX: e.clientX, startY: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  }, [isTop]);

  const onPointerMove = useCallback((e) => {
    if (!dragRef.current.active) return;
    const dx = e.clientX - dragRef.current.startX;
    offsetRef.current = dx;
    setOffset(dx);
  }, []);

  const onPointerUp = useCallback(() => {
    if (!dragRef.current.active) return;
    dragRef.current.active = false;
    const dx = offsetRef.current;
    if (dx > THRESHOLD) onLike();
    else if (dx < -THRESHOLD) onDismiss();
    offsetRef.current = 0;
    setOffset(0);
  }, [onLike, onDismiss]);

  const rotate = offset * 0.04;
  const likeOpacity = Math.min(1, Math.max(0, offset / THRESHOLD));
  const dismissOpacity = Math.min(1, Math.max(0, -offset / THRESHOLD));

  return (
    <div
      className={`discover-card${isTop ? ' discover-card--top' : ''}`}
      style={isTop ? {
        transform: `translateX(${offset}px) rotate(${rotate}deg)`,
        transition: dragRef.current.active ? 'none' : 'transform 0.3s ease',
        cursor: 'grab',
        touchAction: 'none',
        userSelect: 'none',
      } : undefined}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onClick={() => { if (!dragRef.current.active && Math.abs(offset) < 5) onOpen(); }}
    >
      <div className="discover-card__img">
        {recipe.image && <img src={recipe.image} alt={recipe.name} draggable={false} />}
        {!recipe.image && <div className="discover-card__img-placeholder" />}

        {isTop && (
          <>
            <div className="discover-badge discover-badge--like" style={{ opacity: likeOpacity }}>❤ Like</div>
            <div className="discover-badge discover-badge--dismiss" style={{ opacity: dismissOpacity }}>✕ Skip</div>
          </>
        )}
      </div>
      <div className="discover-card__info">
        <p className="discover-card__cat">{recipe.category}</p>
        <h2 className="discover-card__name">{recipe.name}</h2>
        {recipe.nutrition && (
          <p className="discover-card__macros">
            {Math.round(recipe.nutrition.kcal)} kcal · {Math.round(recipe.nutrition.protein)}g P · {Math.round(recipe.nutrition.carbs)}g C · {Math.round(recipe.nutrition.fat)}g F
          </p>
        )}
      </div>
    </div>
  );
}

export default function DiscoverView({ onAddToDate }) {
  const { allRecipes, effectiveMacroProfile, addFavorite, isFavorite, stockLoaded } = useMacroContext();
  const [mealdbRecipes, setMealdbRecipes] = useState([]);
  const [mealdbLoaded, setMealdbLoaded] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);

  useEffect(() => {
    Promise.all(SEED_CATEGORIES.map((c) => fetchMealsByCategory(c).catch(() => [])))
      .then((results) => setMealdbRecipes(results.flat()))
      .finally(() => setMealdbLoaded(true));
  }, []);

  // Merge: stock/custom first (have macros), mealdb fills the rest
  const pool = useMemo(() => {
    const allKnownIds = new Set(allRecipes.map((r) => r.id));
    return [...allRecipes, ...mealdbRecipes.filter((r) => !allKnownIds.has(r.id))];
  }, [allRecipes, mealdbRecipes]);

  const { queue, dismiss, like } = useDiscover(pool, effectiveMacroProfile);

  const topRecipe = queue[0];

  const handleLike = useCallback(() => {
    if (!topRecipe) return;
    addFavorite(topRecipe);
    like(topRecipe.id);
  }, [topRecipe, addFavorite, like]);

  const handleDismiss = useCallback(() => {
    if (!topRecipe) return;
    dismiss(topRecipe.id);
  }, [topRecipe, dismiss]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'ArrowRight') handleLike();
      if (e.key === 'ArrowLeft') handleDismiss();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleLike, handleDismiss]);

  if (!stockLoaded || !mealdbLoaded) {
    return (
      <div className="discover-view">
        <div className="discover-loading">
          <div className="discover-loading__spinner" />
          <p>Loading recipes…</p>
        </div>
      </div>
    );
  }

  if (!queue.length) {
    return (
      <div className="discover-view">
        <div className="discover-empty">
          <span className="discover-empty__icon">🎉</span>
          <h2>You've seen everything!</h2>
          <p>Refresh the page to start over.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="discover-view">
      <div className="discover-stack">
        {queue.slice(0, 3).map((recipe, i) => (
          <div
            key={recipe.id}
            className="discover-stack__slot"
            style={{
              zIndex: 3 - i,
              transform: i === 0 ? undefined : `scale(${1 - i * 0.04}) translateY(${i * 14}px)`,
              transition: 'transform 0.3s ease',
              pointerEvents: i === 0 ? 'auto' : 'none',
            }}
          >
            <SwipeCard
              recipe={recipe}
              isTop={i === 0}
              onLike={handleLike}
              onDismiss={handleDismiss}
              onOpen={() => setSelectedRecipe(recipe)}
            />
          </div>
        ))}
      </div>

      <div className="discover-actions">
        <button
          className="discover-btn discover-btn--dismiss"
          onClick={handleDismiss}
          aria-label="Skip"
          title="Skip (←)"
        >
          <X size={26} strokeWidth={2.5} />
        </button>
        <span className="discover-hint">{queue.length} left</span>
        <button
          className={`discover-btn discover-btn--like${topRecipe && isFavorite(topRecipe.id) ? ' discover-btn--liked' : ''}`}
          onClick={handleLike}
          aria-label="Like"
          title="Like (→)"
        >
          <Heart size={26} strokeWidth={2.5} fill={topRecipe && isFavorite(topRecipe.id) ? 'currentColor' : 'none'} />
        </button>
      </div>

      {selectedRecipe && (
        <RecipeDetailModal
          meal={selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
          onAddToDate={onAddToDate}
          onFork={null}
        />
      )}
    </div>
  );
}
