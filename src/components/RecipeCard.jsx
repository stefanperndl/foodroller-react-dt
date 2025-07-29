import '../App.css';

export function RecipeCard({ Food }) {
  console.log(Food)
  return (
      <div className="recipe-card" id="recipe-card">
        <h2 className="recipe-title">{Food.name}</h2>
        <img src={Food.image} alt="Recipe Image" className="recipe-image" />
      </div>
  );
}

