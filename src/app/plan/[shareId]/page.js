'use client';
import { useState, useEffect, use } from 'react';
import { Printer } from 'lucide-react';
import { getSharedPlan, markMealCompleted } from '../../../utils/shareUtils';
import { getDatesInRange, mergeIngredients } from '../../../utils/utils';
import { getNutrition, DEFAULT_SERVINGS, MIN_KCAL_TOTAL } from '../../../api/nutrition';

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

function norm(raw) {
  if (!raw || raw.kcal < MIN_KCAL_TOTAL) return null;
  return {
    kcal:    Math.round(raw.kcal    / DEFAULT_SERVINGS),
    protein: Math.round(raw.protein / DEFAULT_SERVINGS),
    carbs:   Math.round(raw.carbs   / DEFAULT_SERVINGS),
    fat:     Math.round(raw.fat     / DEFAULT_SERVINGS),
  };
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
  const [plan, setPlan]               = useState(null);
  const [loading, setLoading]         = useState(true);
  const [expired, setExpired]         = useState(false);
  const [completed, setCompleted]     = useState({});
  const [nutritionMap, setNutritionMap] = useState({});

  // Let the page scroll — main app locks #root overflow for SPA layout
  useEffect(() => {
    const root = document.getElementById('root');
    if (!root) return;
    const prev = { overflow: root.style.overflow, height: root.style.height };
    root.style.overflow = 'auto';
    root.style.height = 'auto';
    return () => { root.style.overflow = prev.overflow; root.style.height = prev.height; };
  }, []);

  // Load plan
  useEffect(() => {
    getSharedPlan(shareId)
      .then((data) => {
        if (!data) { setExpired(true); return; }
        setPlan(data);
        setCompleted(data.completedMeals ?? {});
        setNutritionMap(data.nutritionMap ?? {});
      })
      .catch(() => setExpired(true))
      .finally(() => setLoading(false));
  }, [shareId]);

  // Backfill nutrition for any meals missing from the snapshot
  useEffect(() => {
    if (!plan) return;
    const meals = [];
    for (const daySlots of Object.values(plan.meals)) {
      for (const meal of Object.values(daySlots)) {
        if (meal?.ingredients?.length) meals.push(meal);
      }
    }
    const missing = meals.filter((m) => {
      const k = m.id ?? m.name;
      return k && !nutritionMap[k];
    });
    if (!missing.length) return;

    let cancelled = false;
    Promise.all(
      missing.map((m) =>
        getNutrition(m.id ?? m.name, m.ingredients)
          .then((n) => n ? { key: m.id ?? m.name, n } : null)
          .catch(() => null)
      )
    ).then((results) => {
      if (cancelled) return;
      const additions = {};
      results.forEach((r) => { if (r) additions[r.key] = r.n; });
      if (Object.keys(additions).length) {
        setNutritionMap((prev) => ({ ...prev, ...additions }));
      }
    });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan]);

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

  const { meals, slots, macroProfile, dateRange, title, ownerDisplayName } = plan;
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
              const n = meal ? norm(nutritionMap[meal.id ?? meal.name]) : null;
              if (n) {
                dayKcal    += n.kcal;
                dayProtein += n.protein;
                dayCarbs   += n.carbs;
                dayFat     += n.fat;
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
                const n = meal ? norm(nutritionMap[meal.id ?? meal.name]) : null;
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
                      {n && (
                        <p className="shared-slot__macros">
                          {n.kcal} kcal · {n.protein}g P · {n.carbs}g C · {n.fat}g F
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
