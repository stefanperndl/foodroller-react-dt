# FoodRoller Backlog

This file lists planned and requested features for future versions of FoodRoller.

---

## ✅ Recently Completed

- **Recipe Detail View/Modal:**  
  Click any recipe card to view full details including ingredients, cooking instructions, cuisine, dietary badges, and tags. Modal displays with dark grey/white styling, compact multi-column ingredient layout, and prominent dietary restriction badges. Includes "Add to Date" button in Browse view.

- **Recipe Catalog/Browse View:**  
  Browse recipes by category before adding to plan. Includes responsive grid, category filtering, dietary restriction filtering, "Add to Date" functionality with modal, and tab-based navigation between Plan and Browse views.

- **Dietary Restrictions (v1.0):**  
  Three preset dietary filters (Vegetarian 🌱, Vegan 🥗, Pescatarian 🐟) with automatic category filtering and ingredient validation. Includes retry logic and client-side validation to work with free API limitations.

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

- **Export Shopping List:**  
  Export the shopping list as PDF, CSV, or send via Email.

---

## 🚧 Planned Features

- **Recipe Search:**  
  Add a search bar to find recipes by name or ingredient across all categories. Complements the browse view with keyword-based discovery.

- **Recipe Tags/Labels:**  
  Display additional metadata on recipe cards: difficulty level (Easy/Medium/Hard), prep time, cooking time, serving size. Enable filtering by these tags.
  
  **Note:** TheMealDB free API does not include cooking/prep time fields. This would require either:
  - Upgrading to Premium API (if available)
  - Manual entry system for custom recipes
  - Integration with additional recipe APIs

- **Recipe History:**  
  Track previously viewed or added recipes. Show "Recently Viewed" section in Browse view for quick access.

- **Share Recipe:**  
  Generate shareable links for individual recipes. Allow users to share their meal plans with friends/family.

- **Print Recipe:**  
  Print-friendly format for individual recipes from the detail view. Include ingredients checklist and step-by-step instructions.

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