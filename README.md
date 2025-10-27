# FoodRoller

FoodRoller is a modern meal planning app that helps you randomly generate meal suggestions for a chosen date range, save your favorites, and automatically create a shopping list from your selections. It features category filtering, a responsive design, and a beautiful, user-friendly interface.

---

## 🚀 Features

- **Random Meal Suggestions:** Get random recipes for each day in your selected timeframe.
- **Save & Lock Meals:** Save meals you like for specific days so they won't change unless you re-roll them.
- **Dietary Restrictions:** Select from preset dietary filters (Vegetarian 🌱, Vegan 🥗, Pescatarian 🐟) to automatically exclude incompatible meals and categories.
- **Category Filtering:** Use the sidebar to filter meal suggestions by category (e.g., Beef, Vegetarian, etc.).
- **Responsive Shopping Cart:** See a shopping list of all ingredients needed for your saved meals, clustered by recipe.
- **Modern UI:** Responsive grid layout, collapsible sidebar, and a clean, modern look.

---


## 🛠️ Installation

1. **Clone the repository:**
  ```sh
  git clone https://github.com/yourusername/foodroller.git
  cd foodroller
  ```

2. **Install dependencies:**
  ```sh
  npm install
  ```
  or, if you use yarn:
  ```sh
  yarn install
  ```

---

## 🔑 API Configuration

FoodRoller uses [TheMealDB API](https://www.themealdb.com/api.php) to fetch recipe data.

### Free API Limitations

The app currently uses the **free API tier** (test key: "1"), which has the following limitations:
- ✅ Random meal lookup
- ✅ Filter by single category
- ✅ Full meal details by ID
- ❌ **No multi-category filtering** (Premium only)
- ❌ No multi-ingredient filtering (Premium only)

### Category Filtering Workaround

Since the free API doesn't support filtering by multiple categories in a single request, we've implemented a workaround:

1. When you select multiple categories in the sidebar, the app **picks one random category** from your selection
2. It then fetches a random meal from that chosen category
3. This gives variety while respecting your category preferences

**Example:** If you select "Beef", "Chicken", and "Seafood":
- The app randomly picks one (e.g., "Chicken")
- Fetches a random chicken recipe
- Next roll might pick "Seafood" instead

### Upgrading to Premium API

To get true multi-category filtering and other advanced features:
1. Visit [TheMealDB Patreon](https://www.patreon.com/thedatadb) to become a supporter
2. You'll receive an upgraded API key
3. Replace the API key in `src/api/recipes.js`

For more details, see the [API documentation](https://www.themealdb.com/api.php).

---

## 🥗 Dietary Restrictions

FoodRoller includes built-in dietary restriction presets to help you find meals that match your dietary preferences.

### Available Presets

- **Vegetarian 🌱**
  - Excludes: Beef, Pork, Lamb, Chicken, Goat, Seafood
  - Filters out: All meat, poultry, and fish ingredients

- **Vegan 🥗**
  - Excludes: Beef, Pork, Lamb, Chicken, Goat, Seafood
  - Filters out: All animal products (meat, fish, dairy, eggs, honey)

- **Pescatarian 🐟**
  - Excludes: Beef, Pork, Lamb, Chicken, Goat
  - Filters out: Meat and poultry ingredients (allows seafood and fish)

### How It Works

1. **Category Pre-filtering:** When a dietary restriction is active, incompatible categories are automatically hidden from the category list and excluded from random selection.

2. **Ingredient Validation:** After fetching a meal, the app validates it against the restriction's excluded ingredients list.

3. **Retry Logic:** If a meal doesn't pass validation, the app automatically retries up to 5 times to find a compatible meal.

4. **Client-side Filtering:** Due to free API limitations, validation happens on the client side after fetching meals, rather than through API parameters.

### Usage

1. Click a dietary preset button in the sidebar (Vegetarian, Vegan, or Pescatarian)
2. The button will turn green to indicate it's active
3. Compatible categories will be shown; incompatible ones will be hidden
4. When you roll for meals, only compatible recipes will be selected

**Note:** You can combine dietary restrictions with manual category selection for even more specific filtering.

### Future Enhancements

The dietary restrictions system is designed to be extensible. Future additions may include:
- Gluten-free
- Nut-free
- Dairy-free
- Keto
- Low-carb
- Custom dietary profiles

See [BACKLOG.md](./BACKLOG.md) for planned features.

---

## ▶️ Usage

1. **Start the development server (Next.js):**
  ```sh
  npm run dev
  ```
  or
  ```sh
  yarn dev
  ```

2. **Build for production:**
  ```sh
  npm run build
  npm start
  ```
  or
  ```sh
  yarn build
  yarn start
  ```

3. **Open your browser and go to:**  
  [http://localhost:3000](http://localhost:3000)

---

## 🧪 Running Tests

This project uses Jest and React Testing Library for unit and integration tests.

To run all tests:
```sh
npm test
```
or
```sh
yarn test
```

---

---

## ▶️ Usage

1. **Start the development server:**
   ```sh
   npm start
   ```
   or
   ```sh
   yarn start
   ```

2. **Open your browser and go to:**  
   [http://localhost:3000](http://localhost:3000)

---

## 📝 How It Works

- **Select a Date Range:**  
  Use the date picker at the top to choose your meal planning period.

- **Roll for Meals:**  
  Click the "Roll!" button to generate random meal suggestions for each day.  
  You can re-roll all unsaved days at any time.

- **Save Meals:**  
  Click "Save" on a meal to lock it for that day. Saved meals won’t change unless you explicitly re-roll them.

- **Category Filter:**  
  Open the sidebar (left arrow) to filter meal suggestions by category. Only meals from selected categories will be suggested.

- **Dietary Restrictions:**  
  Click dietary preset buttons (Vegetarian 🌱, Vegan 🥗, Pescatarian 🐟) in the sidebar to automatically filter out incompatible meals. Active presets are highlighted in green. Incompatible categories are automatically hidden from the category list.

- **Shopping Cart:**  
  Click the shopping cart icon (bottom right of the navbar) to view a shopping list.  
  The list is grouped by recipe and shows all ingredients needed for your saved meals.

- **Re-roll Individual Days:**  
  Click "Re-roll" on a saved day to get a new suggestion for that day (with confirmation).

---

## 📦 Tech Stack

- **React** (with hooks)
- **Next.js 15** (App Router with static export)
- **CSS** (custom, responsive)
- **[TheMealDB API](https://www.themealdb.com/api.php)** for recipes and categories
- **Jest & React Testing Library** for testing

---

## 🗂️ Backlog & Planned Features

See [BACKLOG.md](./BACKLOG.md) for upcoming features and ideas.

---

## 📄 License

MIT License

---

## 🙏 Acknowledgements

- [TheMealDB](https://www.themealdb.com/) for the free meal and category API.
- Inspired by the need for easy, fun meal planning!

---

Enjoy using FoodRoller! 🍲🎲