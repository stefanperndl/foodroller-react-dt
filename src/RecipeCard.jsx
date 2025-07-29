import './App.css';

export function RecipeCard({ Food }) {
  console.log(Food)
  return (
      <div class="recipe-card" id="recipe-card">
        <h2 class="recipe-title">{Food.name}</h2>
        <img src={Food.image} alt="Recipe Image" class="recipe-image" />
{/* 
        <div class="recipe-details">
          <h3>Ingredients</h3>
        <ul className="ingredients-list">
          {Food.ingredients?.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
          <h3>Instructions</h3>
          <p class="recipe-instructions">
              {Food.instructions}
          </p> 
        </div>*/}
      </div>
  );
}

