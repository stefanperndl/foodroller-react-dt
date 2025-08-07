# FoodRoller

FoodRoller is a modern meal planning app that helps you randomly generate meal suggestions for a chosen date range, save your favorites, and automatically create a shopping list from your selections. It features category filtering, a responsive design, and a beautiful, user-friendly interface.

---

## 🚀 Features

- **Random Meal Suggestions:** Get random recipes for each day in your selected timeframe.
- **Save & Lock Meals:** Save meals you like for specific days so they won’t change unless you re-roll them.
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

- **Shopping Cart:**  
  Click the shopping cart icon (bottom right of the navbar) to view a shopping list.  
  The list is grouped by recipe and shows all ingredients needed for your saved meals.

- **Re-roll Individual Days:**  
  Click "Re-roll" on a saved day to get a new suggestion for that day (with confirmation).

---

## 📦 Tech Stack

- **React** (with hooks)
- **CSS** (custom, responsive)
- **[TheMealDB API](https://www.themealdb.com/api.php)** for recipes and categories

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