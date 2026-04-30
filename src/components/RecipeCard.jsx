export function RecipeCard({ Food, onClick }) {
  if (!Food || !Food.name) return null;

  const handleClick = () => {
    if (onClick) onClick(Food);
  };

  return (
    <div
      className="recipe-card"
      data-testid="recipe-card"
      onClick={handleClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className="recipe-card__img">
        <img src={Food.image} alt={Food.name} loading="lazy" />
        {Food.category && <span className="recipe-card__cat">{Food.category}</span>}
      </div>
      <div className="recipe-card__body">
        <div className="recipe-card__name">{Food.name}</div>
      </div>
    </div>
  );
}
