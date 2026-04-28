import { FoodList } from "./components/FoodList";
import React from 'react';
import { useState, useEffect } from "react";
import { TimeframePicker } from "./components/TimeframePicker";
import { getDatesInRange } from "./utils/utils";
import { fetchRecipeByCategories, fetchMealById } from "./api/recipes";
import { useMealplan } from "./hooks/useMealplan";
import { ShoppingCart } from "./components/ShoppingCart";
import { CategorySidebar } from "./components/CategorySidebar";
import RecipeBrowser from "./components/RecipeBrowser";
import AddToDateModal from "./components/AddToDateModal";
import { useAuth } from "./context/AuthContext";
import AuthModal from "./components/AuthModal";
import UserMenu from "./components/UserMenu";
import MacroProfileModal from "./components/MacroProfileModal";
import MacroDashboard from "./components/MacroDashboard";
import { useMacroProfile } from "./hooks/useMacroProfile";

function App() {
  const { user } = useAuth();
  const today = new Date();
  const defaultEnd = new Date();
  defaultEnd.setDate(today.getDate() + 4);

  const [startDate, setStartDate] = useState(today.toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(defaultEnd.toISOString().slice(0, 10));
  const [food, setFood] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mealplan, setMealplan, mealplanLoaded] = useMealplan(user);
  const [macroProfile, setMacroProfile] = useMacroProfile(user);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showMacroModal, setShowMacroModal] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedRestrictions, setSelectedRestrictions] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState('plan'); // 'plan' or 'browse'
  const [selectedMealForDate, setSelectedMealForDate] = useState(null);

  // Fetch categories on mount
  useEffect(() => {
    fetch("https://www.themealdb.com/api/json/v1/1/categories.php")
      .then((res) => res.json())
      .then((data) => setCategories(data.categories || []));
  }, []);

  // Only build empty food slots when timeframe changes
  useEffect(() => {
    if (!mealplanLoaded) return;
    const dates = getDatesInRange(new Date(startDate), new Date(endDate));
    const loaded = dates.map((dateObj) => {
      const dateStr = dateObj.toISOString().slice(0, 10);
      if (mealplan[dateStr]) {
        return { ...mealplan[dateStr], date: dateStr, saved: true };
      }
      return { date: dateStr, saved: false };
    });
    setFood(loaded);
  }, [startDate, endDate, mealplanLoaded, mealplan]);

  // Roll recipes for all days in range, but keep saved ones unless confirmed
  const handleRoll = async () => {
    setLoading(true);
    const dates = getDatesInRange(new Date(startDate), new Date(endDate));
    const newFood = [];
    for (let dateObj of dates) {
      const dateStr = dateObj.toISOString().slice(0, 10);
      if (mealplan[dateStr]) {
        newFood.push({ ...mealplan[dateStr], date: dateStr, saved: true });
      } else {
        const recipe = await fetchRecipeByCategories(selectedCategories, selectedRestrictions);
        newFood.push({ ...recipe, date: dateStr, saved: false });
      }
    }
    setFood(newFood);
    setLoading(false);
  };

  const handleSave = (date, recipe) => {
    setMealplan((prev) => ({
      ...prev,
      [date]: recipe,
    }));
    setFood((prev) =>
      prev.map((f) => (f.date === date ? { ...f, saved: true } : f))
    );
  };

  const handleReroll = async (date) => {
    if (mealplan[date]) {
      if (
        !window.confirm(
          "This day is saved. Re-rolling will overwrite it. Continue?"
        )
      )
        return;
      setMealplan((prev) => {
        const copy = { ...prev };
        delete copy[date];
        return copy;
      });
    }
    setLoading(true);
    const recipe = await fetchRecipeByCategories(selectedCategories, selectedRestrictions);
    setFood((prev) =>
      prev.map((f) => (f.date === date ? { ...recipe, date, saved: false } : f))
    );
    setLoading(false);
  };

  // In App.js
  const getIngredientsByRecipe = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const result = {};
    Object.entries(mealplan).forEach(([date, recipe]) => {
      if (new Date(date) >= today) {
        result[date] = {
          name: recipe.name,
          ingredients: recipe.ingredients || [],
        };
      }
    });
    return result;
  };

  // Handle adding a browsed meal to a specific date
  const handleAddMealToDate = (meal) => {
    setSelectedMealForDate(meal);
  };

  const confirmAddMealToDate = async (date, meal) => {
    try {
      // Fetch full details if we only have the preview
      const fullRecipe = meal.ingredients 
        ? meal 
        : await fetchMealById(meal.id);
      
      // Add to mealplan
      setMealplan((prev) => ({
        ...prev,
        [date]: fullRecipe,
      }));
      
      // Update food list if date is in current timeframe
      setFood((prev) =>
        prev.map((f) => 
          f.date === date 
            ? { ...fullRecipe, date, saved: true } 
            : f
        )
      );
      
      setSelectedMealForDate(null);
      setActiveView('plan'); // Switch back to plan view
    } catch (err) {
      console.error('Error adding meal to date:', err);
      alert('Failed to add meal. Please try again.');
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="app-header-top">
          <span className="app-title">FoodRoller</span>
          <div className="app-header-actions">
            <button className="btn-goals" onClick={() => setShowMacroModal(true)}>
              {macroProfile ? `${macroProfile.kcal} kcal · ${macroProfile.protein}g P` : 'Set goals'}
            </button>
            <div
              className="cart-icon"
              onClick={() => setShowCart(true)}
              title="Show shopping list"
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path
                  d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-1.99.9-1.99 2S15.9 22 17 22s2-.9 2-2-.9-2-2-2zM7.16 14l.84-2h7.45c.75 0 1.41-.41 1.75-1.03l3.24-5.88A1 1 0 0 0 19.45 4H5.21l-.94-2H1v2h2l3.6 7.59-1.35 2.44C4.52 15.37 5.48 17 7 17h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12z"
                  fill="#fff"
                />
              </svg>
            </div>
            {user ? (
              <UserMenu />
            ) : (
              <button className="btn-signin" onClick={() => setShowAuthModal(true)}>
                Sign in
              </button>
            )}
          </div>
        </div>
        <TimeframePicker
          startDate={startDate}
          endDate={endDate}
          onStartChange={setStartDate}
          onEndChange={setEndDate}
          disabled={loading}
        />
      </header>

      {/* View Tabs */}
      <div className="view-tabs">
        <button 
          className={`view-tab ${activeView === 'plan' ? 'active' : ''}`}
          onClick={() => setActiveView('plan')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          My Plan
        </button>
        <button
          className={`view-tab ${activeView === 'browse' ? 'active' : ''}`}
          onClick={() => setActiveView('browse')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
          Browse Recipes
        </button>
        <button
          className={`view-tab ${activeView === 'macros' ? 'active' : ''}`}
          onClick={() => setActiveView('macros')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10"></line>
            <line x1="12" y1="20" x2="12" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="14"></line>
          </svg>
          Macros
        </button>
      </div>

      {showCart ? (
        <ShoppingCart
          ingredientsByRecipe={getIngredientsByRecipe()}
          onClose={() => setShowCart(false)}
        />
      ) : (
        <>
          <CategorySidebar
            open={sidebarOpen}
            categories={categories}
            selected={selectedCategories}
            restrictions={selectedRestrictions}
            onToggle={() => setSidebarOpen((open) => !open)}
            onSelect={(cat) =>
              setSelectedCategories((selected) =>
                selected.includes(cat)
                  ? selected.filter((c) => c !== cat)
                  : [...selected, cat]
              )
            }
            onRestrictionToggle={(restriction) =>
              setSelectedRestrictions((selected) =>
                selected.includes(restriction)
                  ? selected.filter((r) => r !== restriction)
                  : [...selected, restriction]
              )
            }
          />
          
          {activeView === 'plan' && (
            <FoodList
              food={food}
              loading={loading}
              onSave={handleSave}
              onReroll={handleReroll}
            />
          )}
          {activeView === 'browse' && (
            <RecipeBrowser
              categories={categories.map(cat => cat.strCategory)}
              selectedCategories={selectedCategories}
              selectedRestrictions={selectedRestrictions}
              onAddToDate={handleAddMealToDate}
            />
          )}
          {activeView === 'macros' && (
            <MacroDashboard
              mealplan={mealplan}
              macroProfile={macroProfile}
              startDate={startDate}
              endDate={endDate}
            />
          )}
        </>
      )}

      {activeView === 'plan' && !showCart && (
        <div className="roll-button-container">
          <button
            className="btn btn-roll-main"
            onClick={handleRoll}
            title="Roll random meals for the selected timeframe"
          >
            {loading ? "Rolling..." : "Roll"}
          </button>
        </div>
      )}

      {selectedMealForDate && (
        <AddToDateModal
          meal={selectedMealForDate}
          onConfirm={confirmAddMealToDate}
          onCancel={() => setSelectedMealForDate(null)}
        />
      )}

      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}

      {showMacroModal && (
        <MacroProfileModal
          profile={macroProfile}
          onSave={setMacroProfile}
          onClose={() => setShowMacroModal(false)}
        />
      )}
    </div>
  );
}

export default App;
