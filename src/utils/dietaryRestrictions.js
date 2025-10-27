// Dietary restriction profiles with category and ingredient exclusions
export const DIETARY_RESTRICTIONS = {
  vegetarian: {
    name: 'Vegetarian',
    icon: '🌱',
    excludeCategories: ['Beef', 'Pork', 'Lamb', 'Goat', 'Chicken', 'Seafood'],
    excludeIngredients: [
      'beef', 'pork', 'lamb', 'chicken', 'turkey', 'bacon', 'ham',
      'sausage', 'salami', 'prosciutto', 'duck', 'goat', 'veal',
      'meat', 'fish', 'salmon', 'tuna', 'cod', 'shrimp', 'prawn',
      'lobster', 'crab', 'anchovy', 'seafood', 'haddock', 'mackerel',
      'sardines', 'trout', 'bass', 'mussel', 'oyster', 'clam', 'squid',
      'octopus', 'scallop', 'crayfish'
    ]
  },
  vegan: {
    name: 'Vegan',
    icon: '🥗',
    excludeCategories: ['Beef', 'Pork', 'Lamb', 'Goat', 'Chicken', 'Seafood'],
    excludeIngredients: [
      'beef', 'pork', 'lamb', 'chicken', 'turkey', 'bacon', 'ham',
      'sausage', 'meat', 'fish', 'salmon', 'tuna', 'seafood',
      'milk', 'cheese', 'butter', 'egg', 'cream', 'yogurt', 'yoghurt',
      'cheddar', 'parmesan', 'mozzarella', 'feta', 'ricotta',
      'mayonnaise', 'honey', 'gelatin', 'whey', 'casein'
    ]
  },
  pescatarian: {
    name: 'Pescatarian',
    icon: '🐟',
    excludeCategories: ['Beef', 'Pork', 'Lamb', 'Goat', 'Chicken'],
    excludeIngredients: [
      'beef', 'pork', 'lamb', 'chicken', 'turkey', 'bacon', 'ham',
      'sausage', 'salami', 'duck', 'goat', 'veal', 'meat'
    ]
  }
};

// Validate if a meal meets dietary restrictions
export function validateMealAgainstRestrictions(meal, restrictions) {
  if (!restrictions || restrictions.length === 0) {
    return true; // No restrictions, all meals are valid
  }

  // Check each active restriction
  for (const restrictionKey of restrictions) {
    const restriction = DIETARY_RESTRICTIONS[restrictionKey];
    if (!restriction) continue;

    // Check category exclusions
    if (meal.category && restriction.excludeCategories.includes(meal.category)) {
      return false;
    }

    // Check ingredient exclusions
    if (meal.ingredients && Array.isArray(meal.ingredients)) {
      for (const ingredient of meal.ingredients) {
        const ingredientLower = ingredient.toLowerCase();
        for (const excluded of restriction.excludeIngredients) {
          if (ingredientLower.includes(excluded)) {
            return false;
          }
        }
      }
    }
  }

  return true; // Passed all restriction checks
}

// Get compatible categories for selected restrictions
export function getCompatibleCategories(restrictions, allCategories) {
  if (!restrictions || restrictions.length === 0) {
    return allCategories;
  }

  const excludedCategories = new Set();
  
  restrictions.forEach(restrictionKey => {
    const restriction = DIETARY_RESTRICTIONS[restrictionKey];
    if (restriction && restriction.excludeCategories) {
      restriction.excludeCategories.forEach(cat => excludedCategories.add(cat));
    }
  });

  return allCategories.filter(cat => !excludedCategories.has(cat.strCategory));
}
