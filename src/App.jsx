import { FoodList } from "./components/FoodList";
import React, { useState, useEffect } from "react";
import { TimeframePicker } from "./components/TimeframePicker";
import { fetchMealById } from "./api/recipes";
import { ShoppingCart } from "./components/ShoppingCart";
import { FilterBar } from "./components/FilterBar";
import RecipeBrowser from "./components/RecipeBrowser";
import AddToDateModal from "./components/AddToDateModal";
import { useAuth } from "./context/AuthContext";
import AuthModal from "./components/AuthModal";
import UserMenu from "./components/UserMenu";
import MacroProfileModal from "./components/MacroProfileModal";
import MacroDashboard from "./components/MacroDashboard";
import PlannerModal from "./components/PlannerModal";
import SlotManagerModal from "./components/SlotManagerModal";
import { CalendarDays, Search, BarChart2, ShoppingBag, Moon, Sun } from "lucide-react";
import ClientManagerModal from "./components/ClientManagerModal";
import SharePlanModal from "./components/SharePlanModal";
import { useMacroContext } from "./context/MacroContext";
import { useMealPlanContext } from "./context/MealPlanContext";

function App() {
  const { user } = useAuth();
  const {
    effectiveMacroProfile,
    isDietitian, claimDietitianRole,
    clients,
    activeClient, setActiveClient,
  } = useMacroContext();
  const { setMealplan, cartCount } = useMealPlanContext();

  const today = new Date();
  const defaultEnd = new Date();
  defaultEnd.setDate(today.getDate() + 4);

  const [startDate, setStartDate] = useState(today.toISOString().slice(0, 10));
  const [endDate, setEndDate]     = useState(defaultEnd.toISOString().slice(0, 10));
  const [darkMode, setDarkMode]   = useState(false);
  const [activeView, setActiveView]               = useState('plan');
  const [selectedMealForDate, setSelectedMealForDate] = useState(null);
  const [showAuthModal, setShowAuthModal]       = useState(false);
  const [showMacroModal, setShowMacroModal]     = useState(false);
  const [showPlannerModal, setShowPlannerModal] = useState(false);
  const [showSlotManager, setShowSlotManager]   = useState(false);
  const [showCart, setShowCart]                 = useState(false);
  const [showClientManager, setShowClientManager] = useState(false);
  const [showShareModal, setShowShareModal]     = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', 'herb');
    root.setAttribute('data-font', 'editorial');
    root.setAttribute('data-density', 'comfortable');
    root.setAttribute('data-dark', darkMode ? 'true' : 'false');
  }, [darkMode]);

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

  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="navbar__logo">
          FoodRoller
        </div>
        <div className="navbar__tabs">
          <button
            className={activeView === 'plan' ? 'active' : ''}
            onClick={() => setActiveView('plan')}
          >
            <CalendarDays size={15} strokeWidth={2} /> My Plan
          </button>
          <button
            className={activeView === 'browse' ? 'active' : ''}
            onClick={() => setActiveView('browse')}
          >
            <Search size={15} strokeWidth={2} /> Browse
          </button>
          <button
            className={activeView === 'macros' ? 'active' : ''}
            onClick={() => setActiveView('macros')}
          >
            <BarChart2 size={15} strokeWidth={2} /> Macros
          </button>
        </div>
        <div className="navbar__spacer" />
        <div className="navbar__actions">
          <button
            className="btn btn--outline btn--icon btn--cart"
            onClick={() => setShowCart((o) => !o)}
            title="Shopping List"
          >
            <ShoppingBag size={17} strokeWidth={1.75} />
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </button>
        </div>
        <div className="navbar__user-section">
          <button
            className="btn--dark-toggle"
            onClick={() => setDarkMode((d) => !d)}
            title={darkMode ? 'Light mode' : 'Dark mode'}
          >
            {darkMode ? <Sun size={16} strokeWidth={1.75} /> : <Moon size={16} strokeWidth={1.75} />}
          </button>
          {isDietitian && (
            <button className="btn--clients" onClick={() => setShowClientManager(true)}>
              Clients{clients.length > 0 ? ` (${clients.length})` : ''}
            </button>
          )}
          {activeClient && (
            <span className="navbar__active-client">
              {activeClient.name}
              <button onClick={() => setActiveClient(null)} aria-label="Back to own plan">×</button>
            </span>
          )}
          <button className="btn--goals" onClick={() => setShowMacroModal(true)}>
            {effectiveMacroProfile
              ? `${effectiveMacroProfile.kcal} kcal · ${effectiveMacroProfile.protein}g P`
              : 'Goals'}
          </button>
          {user ? (
            <>
              {!isDietitian && (
                <button className="btn--dietitian-upgrade" onClick={claimDietitianRole}>
                  Dietitian mode
                </button>
              )}
              <UserMenu />
            </>
          ) : (
            <button className="btn--login" onClick={() => setShowAuthModal(true)}>
              Log in
            </button>
          )}
        </div>
      </nav>

      <div className="app-body">
        {activeView === 'browse' && <FilterBar />}

        <main className="main-content">
          {activeView === 'plan' && (
            <>
              <TimeframePicker
                startDate={startDate}
                endDate={endDate}
                onStartChange={setStartDate}
                onEndChange={setEndDate}
              />
              <FoodList startDate={startDate} endDate={endDate} />
            </>
          )}
          {activeView === 'browse' && (
            <RecipeBrowser onAddToDate={handleAddMealToDate} />
          )}
          {activeView === 'macros' && (
            <MacroDashboard startDate={startDate} endDate={endDate} />
          )}
        </main>

        {activeView === 'plan' && (
          <div className="roll-button-container">
            <button
              className="btn-slots"
              onClick={() => setShowSlotManager(true)}
              title="Manage meal slots"
            >
              Slots
            </button>
            <button
              className="btn btn--share"
              onClick={() => setShowShareModal(true)}
              title="Share this meal plan"
            >
              Share
            </button>
            {effectiveMacroProfile ? (
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
      </div>

      {showCart && <ShoppingCart onClose={() => setShowCart(false)} />}

      {selectedMealForDate && (
        <AddToDateModal
          meal={selectedMealForDate}
          onConfirm={confirmAddMealToDate}
          onCancel={() => setSelectedMealForDate(null)}
        />
      )}

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}

      {showMacroModal && <MacroProfileModal onClose={() => setShowMacroModal(false)} />}

      {showPlannerModal && effectiveMacroProfile && (
        <PlannerModal
          startDate={startDate}
          endDate={endDate}
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

      {showSlotManager && <SlotManagerModal onClose={() => setShowSlotManager(false)} />}

      {showClientManager && <ClientManagerModal onClose={() => setShowClientManager(false)} />}

      {showShareModal && (
        <SharePlanModal
          startDate={startDate}
          endDate={endDate}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
}

export default App;
