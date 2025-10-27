# FoodRoller Backlog

This file lists planned and requested features for future versions of FoodRoller.

---

## ✅ Recently Completed

- **Dietary Restrictions (v1.0):**  
  Three preset dietary filters (Vegetarian 🌱, Vegan 🥗, Pescatarian �) with automatic category filtering and ingredient validation. Includes retry logic and client-side validation to work with free API limitations.

- **Category-based Meal Filtering:**  
  Select multiple categories in sidebar to filter meal suggestions (with workaround for free API's single-category limitation).

- **Ingredient Merging:**  
  Shopping cart now merges and sums similar ingredients, displays which meals need each, and handles units (e.g., tbs to g/ml).

- **Next.js Migration:**  
  Project migrated to Next.js app directory (v15+) with static export mode.

- **Automated Testing:**  
  Test suite for ingredient merging logic (Jest, React Testing Library) with GitHub Actions CI workflow.

---

## 🔥 High Priority

- **Recipe Catalog/Browse View:**  
  Browse food based on category and filtering, not just random rolls.

- **Export Shopping List:**  
  Export the shopping list as PDF, CSV, or send via Email.

---

## 🚧 Planned Features

- **Expand Dietary Restrictions:**  
  Add more presets: Gluten-free, Nut-free, Dairy-free, Keto, Low-carb, Halal, Kosher.
  
- **Custom Dietary Profiles:**  
  Allow users to create their own dietary restriction profiles with custom excluded categories and ingredients.

- **Favorite Recipes:**  
  Mark recipes as favorites and prioritize them in suggestions.

- **User Accounts:**  
  Allow users to create accounts and save their meal plans across devices.

- **Manual Recipe Entry:**  
  Allow users to add their own recipes to the pool.

- **Mobile App:**  
  Native mobile app version for iOS and Android.

- **Localization:**  
  Support for multiple languages and units.

- **Nutritional Information:**  
  Show calories and nutritional info per meal.

- **Nutritional Preferences:**  
  Show recommended food based on calories and nutritional preferences.

- **Weekly/Monthly View:**  
  Calendar view for easier meal planning.

- **Add Nutrition Filters to Sidebar:**  
  Expand the sidebar to allow filtering based on nutrition values (calories, protein, etc.).

- **Manual Categories Entry:**  
  Allow users to add their own categories and make them available in filtering.

- **Premium API Upgrade:**  
  Upgrade to TheMealDB Premium API for true multi-category filtering and advanced features (see TODO in `src/api/recipes.js`).

---

*Feel free to suggest more features by opening an issue or pull request!*