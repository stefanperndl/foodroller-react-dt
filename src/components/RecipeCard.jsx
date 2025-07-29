import '../App.css';

export function RecipeCard({ Food }) {
  console.log(Food)
  return (
      <div class="recipe-card" id="recipe-card">
        <h2 class="recipe-title">{Food.name}</h2>
        <img src={Food.image} alt="Recipe Image" class="recipe-image" />

      </div>
  );
}

