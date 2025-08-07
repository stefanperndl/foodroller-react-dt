# FoodRoller Backlog

This file lists planned and requested features for future versions of FoodRoller.

---

## 🚧 Planned Features (unprioritized)

- **Recipe Cataloge:**  
  Browse food based on category and filtering.

- **Favorite Recipes:**  
  Mark categories as favorites and prioritize them in suggestions.

~~**Ingredient Merging:**~~  
~~Smarter merging of similar ingredients (e.g., "1l milk" + "500ml milk" = "1.5l milk") in the shopping cart.~~
**Done:** Shopping cart now merges and sums similar ingredients, displays which meals need each, and handles units (e.g., tbs to g/ml).
---

## ✅ Recently Completed

- Ingredient merging and total summary in shopping cart (with unit conversion and meal references)
- Project migrated to Next.js app directory (v15+)
- Automated tests for ingredient merging logic (Jest, React Testing Library)
- Test structure moved to `src/__tests__` for best practices
- GitHub Actions CI workflow updated for Next.js and tests
- README updated for Next.js, build, and test instructions

- **User Accounts:**  
  Allow users to create accounts and save their meal plans across devices.

- **Manual Recipe Entry:**  
  Allow users to add their own recipes to the pool.

- **Export Shopping List:**  
  Export the shopping list as PDF or CSV. Send via Email.

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

- **Improved Filtering:**  
  Filter by dietary restrictions (vegan, gluten-free, etc.).

- **Add nutrition filters to sidebar:**  
    Expand the sidebar to allow the filtering based on nutrition.

- **Manual Categories Entry**:
    Allow users to add their own categories and make them available in filtering.
---

*Feel free to suggest more features by opening an issue or pull request!*