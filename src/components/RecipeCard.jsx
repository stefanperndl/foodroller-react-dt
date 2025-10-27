export function RecipeCard({ Food }) {
  if (!Food || !Food.name) return null;
  return (
    <div className="recipe-card">
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
