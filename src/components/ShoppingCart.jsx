import "../App.css";

export function ShoppingCart({ ingredientsByRecipe, onClose }) {
  console.log("ShoppingCart ingredientsByRecipe:", ingredientsByRecipe);
  return (
    <div className="shopping-cart-view">
      <h2>Shopping List</h2>
      <button className="close-cart" onClick={onClose}>
        Close
      </button>
      {Object.entries(ingredientsByRecipe).map(([date, recipe]) => (
        <div key={date} className="shopping-recipe-cluster">
          <h3 style={{ marginBottom: 4 }}>
            {recipe.name ? recipe.name : "Recipe"}{" "}
            <span style={{ fontWeight: "normal", fontSize: "0.9em" }}>
              ({date})
            </span>
          </h3>
          <ul style={{ marginBottom: 16 }}>
            {recipe.ingredients &&
              recipe.ingredients.map((item, idx) => <li key={idx}>{item}</li>)}
          </ul>
        </div>
      ))}
    </div>
  );
}

export default ShoppingCart;
