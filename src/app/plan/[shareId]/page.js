'use client';
import { useState, useEffect, use } from 'react';
import { Printer } from 'lucide-react';
import { getSharedPlan, markMealCompleted } from '../../../utils/shareUtils';
import { getDatesInRange, mergeIngredients } from '../../../utils/utils';

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

function formatDateRange(start, end) {
  const s = new Date(start + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const e = new Date(end + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return `${s} – ${e}`;
}

function statusColor(pct) {
  if (pct < 0.8) return 'var(--color-warning, #f59e0b)';
  if (pct <= 1.1) return 'var(--color-success, #22c55e)';
  return 'var(--color-danger, #ef4444)';
}

function MealImage({ src, alt }) {
  const [errored, setErrored] = useState(false);
  if (src && !errored) {
    return <img src={src} alt={alt} className="shared-slot-img" onError={() => setErrored(true)} />;
  }
  return <div className="shared-slot-img-placeholder"><span>{alt?.[0] ?? '?'}</span></div>;
}

export default function SharedPlanPage({ params }) {
  const { shareId } = use(params);
  const [plan, setPlan]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [expired, setExpired]     = useState(false);
  const [completed, setCompleted] = useState({});

  useEffect(() => {
    getSharedPlan(shareId)
      .then((data) => {
        if (!data) { setExpired(true); return; }
        setPlan(data);
        setCompleted(data.completedMeals ?? {});
      })
      .catch(() => setExpired(true))
      .finally(() => setLoading(false));
  }, [shareId]);

  function handleToggleComplete(date, slotId) {
    const key = `${date}-${slotId}`;
    const next = !completed[key];
    setCompleted((prev) => ({ ...prev, [key]: next }));
    markMealCompleted(shareId, key, next).catch(() => {});
  }

  if (loading) {
    return (
      <div className="shared-plan-page shared-plan-page--loading">
        <p>Loading plan…</p>
      </div>
    );
  }

  if (expired || !plan) {
    return (
      <div className="shared-plan-page shared-plan-page--expired">
        <h1>Link expired or not found</h1>
        <p>This shared plan link is no longer valid. Ask the plan owner to generate a new one.</p>
      </div>
    );
  }

  const { meals, slots, nutritionMap, macroProfile, dateRange, title, ownerDisplayName } = plan;
  const dates = getDatesInRange(
    new Date(dateRange.start + 'T12:00:00'),
    new Date(dateRange.end + 'T12:00:00')
  ).map((d) => d.toISOString().slice(0, 10));

  const ingredientsByRecipe = {};
  for (const [date, daySlots] of Object.entries(meals)) {
    for (const [slotId, meal] of Object.entries(daySlots)) {
      if (meal?.ingredients?.length) {
        ingredientsByRecipe[`${date}-${slotId}`] = { name: meal.name, ingredients: meal.ingredients };
      }
    }
  }
  const shoppingList = mergeIngredients(ingredientsByRecipe);

  return (
    <div className="shared-plan-page">
      <header className="shared-plan-header">
        <div className="shared-plan-header__text">
          {ownerDisplayName && (
            <p className="shared-plan-header__owner">{ownerDisplayName}</p>
          )}
          <h1 className="shared-plan-header__title">
            {title || 'Shared Meal Plan'}
          </h1>
          <p className="shared-plan-header__range">{formatDateRange(dateRange.start, dateRange.end)}</p>
        </div>
        <button
          className="btn btn--outline btn--print shared-plan-no-print"
          onClick={() => window.print()}
        >
          <Printer size={15} strokeWidth={1.75} /> Print / PDF
        </button>
      </header>

      <section className="shared-days">
        {dates.map((date) => {
          const dayMeals = meals[date] ?? {};
          let dayKcal = 0, dayProtein = 0, dayCarbs = 0, dayFat = 0;
          if (macroProfile) {
            for (const meal of Object.values(dayMeals)) {
              const n = meal ? nutritionMap[meal.id ?? meal.name] : null;
              if (n) {
                dayKcal    += n.kcal    ?? 0;
                dayProtein += n.protein ?? 0;
                dayCarbs   += n.carbs   ?? 0;
                dayFat     += n.fat     ?? 0;
              }
            }
          }

          return (
            <div key={date} className="shared-day-column">
              <h2 className="shared-day-heading">{formatDate(date)}</h2>

              {slots.map((slot) => {
                const meal = dayMeals[slot.id];
                const key = `${date}-${slot.id}`;
                const done = !!completed[key];
                if (!meal) {
                  return (
                    <div key={slot.id} className="shared-slot shared-slot--empty">
                      <span className="shared-slot__label">{slot.label}</span>
                    </div>
                  );
                }
                return (
                  <div key={slot.id} className={`shared-slot${done ? ' shared-slot--done' : ''}`}>
                    <label className="shared-slot__check shared-plan-no-print">
                      <input
                        type="checkbox"
                        checked={done}
                        onChange={() => handleToggleComplete(date, slot.id)}
                      />
                    </label>
                    <MealImage src={meal.image} alt={meal.name} />
                    <div className="shared-slot__info">
                      <span className="shared-slot__slot-label">{slot.label}</span>
                      <p className="shared-slot__name">{meal.name}</p>
                      {nutritionMap[meal.id ?? meal.name] && (
                        <p className="shared-slot__macros">
                          {Math.round(nutritionMap[meal.id ?? meal.name].kcal)} kcal ·{' '}
                          {Math.round(nutritionMap[meal.id ?? meal.name].protein)}g P ·{' '}
                          {Math.round(nutritionMap[meal.id ?? meal.name].carbs)}g C ·{' '}
                          {Math.round(nutritionMap[meal.id ?? meal.name].fat)}g F
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}

              {macroProfile && (
                <div className="shared-day-macro-summary">
                  <span style={{ color: statusColor(dayKcal / macroProfile.kcal) }}>
                    {Math.round(dayKcal)} / {macroProfile.kcal} kcal
                  </span>
                  <span>{Math.round(dayProtein)}g P · {Math.round(dayCarbs)}g C · {Math.round(dayFat)}g F</span>
                </div>
              )}
            </div>
          );
        })}
      </section>

      {shoppingList.length > 0 && (
        <section className="shared-shopping">
          <h2>Shopping List</h2>
          <ul className="shared-shopping-list">
            {shoppingList.map((item, idx) => (
              <li key={idx}>
                <span className="shared-shopping-qty">
                  {item.qty % 1 === 0 ? item.qty : item.qty.toFixed(1)}
                  {item.unit ? ` ${item.unit}` : ''}
                </span>
                {' '}{item.name}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
