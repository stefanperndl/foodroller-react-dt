
import { mergeIngredients } from '../utils/utils';

export function ShoppingCart({ ingredientsByRecipe, onClose }) {
  // Merged ingredients for summary
  const mergedIngredients = mergeIngredients(ingredientsByRecipe);
  return (
    <div className="shopping-cart-view">
      <h2>Shopping List</h2>
      <button className="close-cart" onClick={onClose}>
        Close
      </button>
      {/* Merged ingredients summary */}
      <div className="shopping-merged-summary" style={{ marginBottom: 24, background: '#f6f8fa', borderRadius: 12, padding: '16px 14px' }}>
        <h3 style={{ marginTop: 0, marginBottom: 8 }}>Total Ingredients</h3>
        <ul style={{ margin: 0, paddingLeft: 16 }}>
          {mergedIngredients.map((item, idx) => (
            <li key={idx}>
              {item.qty % 1 === 0 ? item.qty : item.qty.toFixed(2)}
              {item.unit ? ` ${item.unit}` : ''} {item.name}
              {item.meals && item.meals.length > 0 && (
                <span style={{ color: '#888', fontSize: '0.95em', marginLeft: 6 }}>
                  ({item.meals.join(', ')})
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
      {/* Per-recipe breakdown as before */}
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
