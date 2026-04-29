import { FoodList } from "./components/FoodList";
import React, { useState, useEffect } from "react";
import { TimeframePicker } from "./components/TimeframePicker";
import { fetchRecipeByCategories, fetchMealById } from "./api/recipes";
import { useMealplan } from "./hooks/useMealplan";
import { useMealSlots } from "./hooks/useMealSlots";
import { useDaySlotOverrides } from "./hooks/useDaySlotOverrides";
import { ShoppingCart } from "./components/ShoppingCart";
import { FilterBar } from "./components/FilterBar";
import RecipeBrowser from "./components/RecipeBrowser";
import AddToDateModal from "./components/AddToDateModal";
import { useAuth } from "./context/AuthContext";
import AuthModal from "./components/AuthModal";
import UserMenu from "./components/UserMenu";
import MacroProfileModal from "./components/MacroProfileModal";
import MacroDashboard from "./components/MacroDashboard";
import { useMacroProfile } from "./hooks/useMacroProfile";
import PlannerModal from "./components/PlannerModal";
import SlotManagerModal from "./components/SlotManagerModal";

function App() {
  const { user } = useAuth();
  const today = new Date();
  const defaultEnd = new Date();
  defaultEnd.setDate(today.getDate() + 4);

  const [startDate, setStartDate] = useState(today.toISOString().slice(0, 10));
  const [endDate, setEndDate]     = useState(defaultEnd.toISOString().slice(0, 10));
  const [mealplan, setMealplan, mealplanLoaded] = useMealplan(user);
  const [slots, setSlots]         = useMealSlots(user);
  const [macroProfile, setMacroProfile] = useMacroProfile(user);
  const [daySlotOverrides, setDaySlotOverrides] = useDaySlotOverrides();
  const [rerollingKey, setRerollingKey] = useState(null);
  const [darkMode, setDarkMode]   = useState(false);

  const getDaySlots = (date) =>
    [...(daySlotOverrides[date] ?? slots)].sort((a, b) => a.order - b.order);

  const handleAddSlotToDay = (date, slot) => {
    setDaySlotOverrides((prev) => {
      const current = prev[date] ?? slots;
      if (current.some((s) => s.id === slot.id)) return prev;
      const updated = [...current, slot].sort((a, b) => a.order - b.order);
      return { ...prev, [date]: updated };
    });
  };

  const handleRemoveSlotFromDay = (date, slotId) => {
    setDaySlotOverrides((prev) => {
      const current = prev[date] ?? slots;
      return { ...prev, [date]: current.filter((s) => s.id !== slotId) };
    });
    setMealplan((prev) => {
      const day = { ...(prev[date] || {}) };
      delete day[slotId];
      const next = { ...prev };
      if (Object.keys(day).length === 0) delete next[date];
      else next[date] = day;
      return next;
    });
  };

  const [showAuthModal, setShowAuthModal]       = useState(false);
  const [showMacroModal, setShowMacroModal]     = useState(false);
  const [showPlannerModal, setShowPlannerModal] = useState(false);
  const [showSlotManager, setShowSlotManager]   = useState(false);
  const [showCart, setShowCart]                 = useState(false);

  const [categories, setCategories]               = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedRestrictions, setSelectedRestrictions] = useState([]);
  const [activeView, setActiveView]               = useState('plan');
  const [selectedMealForDate, setSelectedMealForDate] = useState(null);

  // Apply design tokens to <html>
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', 'herb');
    root.setAttribute('data-font', 'editorial');
    root.setAttribute('data-density', 'comfortable');
    root.setAttribute('data-dark', darkMode ? 'true' : 'false');
  }, [darkMode]);

  useEffect(() => {
    fetch("https://www.themealdb.com/api/json/v1/1/categories.php")
      .then((res) => res.json())
      .then((data) => setCategories(data.categories || []));
  }, []);

  const handleReroll = async (date, slotId) => {
    const key = `${date}-${slotId}`;
    if (mealplan[date]?.[slotId]) {
      if (!window.confirm('Re-rolling will replace this meal. Continue?')) return;
    }
    setRerollingKey(key);
    try {
      const recipe = await fetchRecipeByCategories(selectedCategories, selectedRestrictions);
      const fullRecipe = recipe.ingredients ? recipe : await fetchMealById(recipe.id);
      setMealplan((prev) => ({
        ...prev,
        [date]: { ...(prev[date] || {}), [slotId]: fullRecipe },
      }));
    } finally {
      setRerollingKey(null);
    }
  };

  const handleRemoveMeal = (date, slotId) => {
    setMealplan((prev) => {
      const day = { ...(prev[date] || {}) };
      delete day[slotId];
      const next = { ...prev };
      if (Object.keys(day).length === 0) {
        delete next[date];
      } else {
        next[date] = day;
      }
      return next;
    });
  };

  const handleAddMealToDate = (meal) => {
    setSelectedMealForDate(meal);
  };

  const confirmAddMealToDate = async (date, slotId, meal) => {
    try {
      const fullRecipe = meal.ingredients ? meal : await fetchMealById(meal.id);
      setMealplan((prev) => ({
        ...prev,
        [date]: { ...(prev[date] || {}), [slotId]: fullRecipe },
      }));
      setSelectedMealForDate(null);
      setActiveView('plan');
    } catch (err) {
      console.error('Error adding meal:', err);
      alert('Failed to add meal. Please try again.');
    }
  };

  const getIngredientsByRecipe = () => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const result = {};
    for (const [date, daySlots] of Object.entries(mealplan)) {
      if (new Date(date) < todayStart) continue;
      for (const [slotId, meal] of Object.entries(daySlots)) {
        if (meal?.ingredients?.length) {
          result[`${date}-${slotId}`] = { name: meal.name, ingredients: meal.ingredients };
        }
      }
    }
    return result;
  };

  const cartCount = Object.values(mealplan).reduce(
    (n, day) => n + Object.values(day).filter((m) => m?.ingredients?.length).length,
    0
  );

  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="navbar__logo">
          <span className="navbar__logo-icon">🎲</span>
          FoodRoller
        </div>
        <div className="navbar__tabs">
          <button
            className={activeView === 'plan' ? 'active' : ''}
            onClick={() => setActiveView('plan')}
          >
            📅 My Plan
          </button>
          <button
            className={activeView === 'browse' ? 'active' : ''}
            onClick={() => setActiveView('browse')}
          >
            🔍 Browse
          </button>
          <button
            className={activeView === 'macros' ? 'active' : ''}
            onClick={() => setActiveView('macros')}
          >
            📊 Macros
          </button>
        </div>
        <div className="navbar__spacer" />
        <div className="navbar__actions">
          <button
            className="btn btn--outline btn--icon btn--cart"
            onClick={() => setShowCart((o) => !o)}
            title="Shopping List"
          >
            🛒
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </button>
        </div>
        <div className="navbar__user-section">
          <button
            className="btn--dark-toggle"
            onClick={() => setDarkMode((d) => !d)}
            title={darkMode ? 'Light mode' : 'Dark mode'}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
          <button className="btn--goals" onClick={() => setShowMacroModal(true)}>
            {macroProfile
              ? `${macroProfile.kcal} kcal · ${macroProfile.protein}g P`
              : 'Goals'}
          </button>
          {user ? (
            <UserMenu />
          ) : (
            <button className="btn--login" onClick={() => setShowAuthModal(true)}>
              Log in
            </button>
          )}
        </div>
      </nav>

      <div className="app-body">
        <FilterBar
          categories={categories}
          selectedCategories={selectedCategories}
          restrictions={selectedRestrictions}
          onRestrictionToggle={(restriction) =>
            setSelectedRestrictions((prev) =>
              prev.includes(restriction)
                ? prev.filter((r) => r !== restriction)
                : [...prev, restriction]
            )
          }
          onSelect={(cat) =>
            setSelectedCategories((prev) =>
              prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
            )
          }
          onClearCategories={() => setSelectedCategories([])}
        />

        <main className="main-content">
          {activeView === 'plan' && (
            <>
              <TimeframePicker
                startDate={startDate}
                endDate={endDate}
                onStartChange={setStartDate}
                onEndChange={setEndDate}
              />
              <FoodList
                startDate={startDate}
                endDate={endDate}
                mealplan={mealplan}
                slots={slots}
                getDaySlots={getDaySlots}
                rerollingKey={rerollingKey}
                onReroll={handleReroll}
                onRemove={handleRemoveMeal}
                onAddSlotToDay={handleAddSlotToDay}
                onRemoveSlotFromDay={handleRemoveSlotFromDay}
              />
              <div className="roll-button-container">
                <button
                  className="btn-slots"
                  onClick={() => setShowSlotManager(true)}
                  title="Manage meal slots"
                >
                  Slots
                </button>
                {macroProfile ? (
                  <button
                    className="btn btn-plan-week"
                    onClick={() => setShowPlannerModal(true)}
                    title="Generate an AI meal plan based on your macro goals"
                  >
                    Plan My Week
                  </button>
                ) : (
                  <button
                    className="btn btn-set-goals-cta"
                    onClick={() => setShowMacroModal(true)}
                  >
                    Set nutrition goals → unlock AI planning
                  </button>
                )}
              </div>
            </>
          )}
          {activeView === 'browse' && (
            <RecipeBrowser
              categories={categories.map((cat) => cat.strCategory)}
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
              slots={slots}
            />
          )}
        </main>
      </div>

      {showCart && (
        <ShoppingCart
          ingredientsByRecipe={getIngredientsByRecipe()}
          onClose={() => setShowCart(false)}
        />
      )}

      {selectedMealForDate && (
        <AddToDateModal
          meal={selectedMealForDate}
          slots={slots}
          onConfirm={confirmAddMealToDate}
          onCancel={() => setSelectedMealForDate(null)}
        />
      )}

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}

      {showMacroModal && (
        <MacroProfileModal
          profile={macroProfile}
          onSave={setMacroProfile}
          onClose={() => setShowMacroModal(false)}
        />
      )}

      {showPlannerModal && macroProfile && (
        <PlannerModal
          macroProfile={macroProfile}
          startDate={startDate}
          endDate={endDate}
          selectedCategories={selectedCategories}
          selectedRestrictions={selectedRestrictions}
          slots={slots}
          onApply={(plan) => {
            setMealplan((prev) => {
              const next = { ...prev };
              for (const [date, daySlots] of Object.entries(plan)) {
                next[date] = { ...(next[date] || {}), ...daySlots };
              }
              return next;
            });
          }}
          onClose={() => setShowPlannerModal(false)}
        />
      )}

      {showSlotManager && (
        <SlotManagerModal
          slots={slots}
          onSave={setSlots}
          onClose={() => setShowSlotManager(false)}
        />
      )}
    </div>
  );
}

export default App;
