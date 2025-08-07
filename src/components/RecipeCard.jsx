export function RecipeCard({ Food }) {
  if (!Food || !Food.name) return null; // Don't render if empty
  return (
    <div className="recipe-card" id="recipe-card">
      <h2 className="recipe-title">{Food.name}</h2>
      <img src={Food.image} alt="" className="recipe-image" />
    </div>
  );
}
