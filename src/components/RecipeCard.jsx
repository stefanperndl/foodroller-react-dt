export function RecipeCard({ Food, onClick }) {
  if (!Food || !Food.name) return null;
  
  const handleClick = () => {
    if (onClick) {
      onClick(Food);
    }
  };
  
  return (
    <div 
      className="recipe-card" 
      onClick={handleClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <img 
        src={Food.image} 
        alt={Food.name}
        className="recipe-image"
      />
      <h2 className="recipe-title">{Food.name}</h2>
      {Food.category && (
        <p className="recipe-category">{Food.category}</p>
      )}
    </div>
  );
}
