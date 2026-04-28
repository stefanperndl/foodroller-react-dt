import { FoodList } from "./components/FoodList";
import React from 'react';
import { useState } from "react";
import { TimeframePicker } from "./components/TimeframePicker";
import { fetchRecipeByCategories, fetchMealById } from "./api/recipes";
import { useMealplan } from "./hooks/useMealplan";
import { useMealSlots } from "./hooks/useMealSlots";
import { useDaySlotOverrides } from "./hooks/useDaySlotOverrides";
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
import PlannerModal from "./components/PlannerModal";
import SlotManagerModal from "./components/SlotManagerModal";
import { useEffect } from "react";

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

  const [showAuthModal, setShowAuthModal]     = useState(false);
  const [showMacroModal, setShowMacroModal]   = useState(false);
  const [showPlannerModal, setShowPlannerModal] = useState(false);
  const [showSlotManager, setShowSlotManager] = useState(false);
  const [showCart, setShowCart]               = useState(false);

  const [categories, setCategories]               = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedRestrictions, setSelectedRestrictions] = useState([]);
  const [sidebarOpen, setSidebarOpen]             = useState(false);
  const [activeView, setActiveView]               = useState('plan');
  const [selectedMealForDate, setSelectedMealForDate] = useState(null);

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
            {user ? <UserMenu /> : (
              <button className="btn-signin" onClick={() => setShowAuthModal(true)}>Sign in</button>
            )}
          </div>
        </div>
        <TimeframePicker
          startDate={startDate}
          endDate={endDate}
          onStartChange={setStartDate}
          onEndChange={setEndDate}
        />
      </header>

      <div className="view-tabs">
        <button className={`view-tab ${activeView === 'plan' ? 'active' : ''}`} onClick={() => setActiveView('plan')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          My Plan
        </button>
        <button className={`view-tab ${activeView === 'browse' ? 'active' : ''}`} onClick={() => setActiveView('browse')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
          Browse Recipes
        </button>
        <button className={`view-tab ${activeView === 'macros' ? 'active' : ''}`} onClick={() => setActiveView('macros')}>
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
                selected.includes(cat) ? selected.filter((c) => c !== cat) : [...selected, cat]
              )
            }
            onRestrictionToggle={(restriction) =>
              setSelectedRestrictions((selected) =>
                selected.includes(restriction) ? selected.filter((r) => r !== restriction) : [...selected, restriction]
              )
            }
          />

          {activeView === 'plan' && (
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
        </>
      )}

      {activeView === 'plan' && !showCart && (
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
