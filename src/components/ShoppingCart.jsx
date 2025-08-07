
// Helper to parse and merge ingredients
export function mergeIngredients(ingredientsByRecipe) {
  const merged = {};
  // Regex: [qty] [unit] name, but unit is optional, and name may be one word
  const regex = /^(\d*\.?\d+)?\s*([a-zA-Z]+)?\s*(.*)$/;
  Object.entries(ingredientsByRecipe).forEach(([date, recipe]) => {
    (recipe.ingredients || []).forEach(item => {
      let match = item.match(regex);
      if (!match) return;
      let [, qty, unit, name] = match;
      // If name is empty, but unit is not, treat unit as name (e.g. '1 egg')
      if ((!name || !name.trim()) && unit) {
        name = unit;
        unit = '';
      }
      name = name ? name.trim().toLowerCase() : '';
      unit = unit ? unit.trim().toLowerCase() : '';
      qty = qty ? parseFloat(qty) : 1;
      // Convert tbs to g or ml
      if (unit === 'tbs') {
        if (name.includes('milk') || name.includes('water') || name.includes('juice')) {
          qty = qty * 100;
          unit = 'ml';
        } else {
          qty = qty * 100;
          unit = 'g';
        }
      }
      const key = name + '|' + unit;
      const mealLabel = recipe.name ? recipe.name : 'Recipe';
      if (!merged[key]) {
        merged[key] = { name, unit, qty, meals: new Set([mealLabel]) };
      } else {
        merged[key].qty += qty;
        merged[key].meals.add(mealLabel);
      }
    });
  });
  return Object.values(merged).map(item => ({ ...item, meals: Array.from(item.meals) }));
}

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
