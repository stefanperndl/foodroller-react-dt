// Merges and sums similar ingredients, with unit conversion and meal references
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
export function getDatesInRange(start, end) {
  const dates = [];
  let current = new Date(start);
  while (current <= end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}
