'use client';
import React, { useState, useRef, useEffect } from 'react';
import { RotateCcw, X, SlidersHorizontal } from 'lucide-react';
import { getNutritionFromCache, DEFAULT_SERVINGS, MIN_KCAL_TOTAL } from '../api/nutrition';

import { getDatesInRange } from '../utils/utils';
import { DIETARY_RESTRICTIONS } from '../utils/dietaryRestrictions';
import RecipeDetailModal from './RecipeDetailModal';
import { useFilterContext } from '../context/FilterContext';
import { useMacroContext } from '../context/MacroContext';
import { useMealPlanContext } from '../context/MealPlanContext';

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

function MealImage({ src, alt, placeholder }) {
  const [errored, setErrored] = useState(false);
  if (src && !errored) {
    return <img src={src} alt={alt} className="plan-slot-img" onError={() => setErrored(true)} />;
  }
  return (
    <div className="plan-slot-img-placeholder">
      <span>{placeholder}</span>
    </div>
  );
}

function SlotFilterPopover({ slotId, filters, categories, onChange, onClose, rect }) {
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const style = rect ? {
    position: 'fixed',
    top: rect.bottom + 6,
    right: window.innerWidth - rect.right,
  } : { position: 'fixed', top: 0, right: 0 };

  const toggleRestriction = (key) => {
    const next = filters.restrictions.includes(key)
      ? filters.restrictions.filter((r) => r !== key)
      : [...filters.restrictions, key];
    onChange({ ...filters, restrictions: next });
  };

  const toggleCategory = (cat) => {
    const next = filters.categories.includes(cat)
      ? filters.categories.filter((c) => c !== cat)
      : [...filters.categories, cat];
    onChange({ ...filters, categories: next });
  };

  const hasFilters = filters.restrictions.length > 0 || filters.categories.length > 0;

  return (
    <div className="slot-filter-popover" ref={ref} style={style}>
      <div className="slot-filter-popover__header">
        <span>Roll filters</span>
        {hasFilters && (
          <button className="slot-filter-clear" onClick={() => onChange({ restrictions: [], categories: [] })}>
            Clear
          </button>
        )}
      </div>
      <div className="slot-filter-section">
        <p className="slot-filter-label">Dietary</p>
        <div className="slot-filter-chips">
          {Object.entries(DIETARY_RESTRICTIONS).map(([key, r]) => (
            <button
              key={key}
              className={`slot-filter-chip ${filters.restrictions.includes(key) ? 'active' : ''}`}
              onClick={() => toggleRestriction(key)}
            >
              {r.icon} {r.name}
            </button>
          ))}
        </div>
      </div>
      {categories.length > 0 && (
        <div className="slot-filter-section">
          <p className="slot-filter-label">Category</p>
          <div className="slot-filter-chips slot-filter-chips--grid">
            {categories.map((cat) => (
              <button
                key={cat.strCategory}
                className={`slot-filter-chip ${filters.categories.includes(cat.strCategory) ? 'active' : ''}`}
                onClick={() => toggleCategory(cat.strCategory)}
              >
                {cat.strCategory}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SlotCard({ slot, meal, isRerolling, date, onReroll, onRemove, onRemoveSlot, onDetail, categories, slotFilter, onSlotFilterChange, nutritionMap, macroProfile, dayMeals }) {
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterRect, setFilterRect] = useState(null);
  const filters = slotFilter || { restrictions: [], categories: [] };
  const hasFilters = filters.restrictions.length > 0 || filters.categories.length > 0;

  const handleFilterChange = (newFilters) => {
    onSlotFilterChange(slot.id, newFilters);
  };

  const openFilter = (e) => {
    setFilterRect(e.currentTarget.getBoundingClientRect());
    setFilterOpen((o) => !o);
  };

  return (
    <div className={`plan-slot-card${!meal ? ' plan-slot-card--empty' : ''}`}>
      <div className="plan-slot-card-img">
        <MealImage src={meal?.image} alt={meal?.name ?? slot.label} placeholder={slot.label[0]} />
      </div>
      <div className="plan-slot-card-body">
        <div className="plan-slot-card-meta">
          <span className="plan-slot-card-label">{slot.label}</span>
          <button
            className="plan-slot-remove-day-btn"
            onClick={() => onRemoveSlot(date, slot.id)}
            title={`Remove ${slot.label} from this day`}
          >−</button>
        </div>
        {isRerolling ? (
          <span className="plan-slot-loading">Rolling…</span>
        ) : meal ? (
          <div className="plan-slot-card-meal">
            <div className="plan-slot-meal-info">
              <span className="plan-slot-meal-name" onClick={() => onDetail(meal)} title="View recipe">
                {meal.name}
              </span>
              {(() => {
                const key = meal.id ?? meal.name;
                const raw = key ? (getNutritionFromCache(key) ?? nutritionMap?.[key]) : null;
                if (!raw || raw.kcal < MIN_KCAL_TOTAL) return null;
                const n = {
                  kcal:    Math.round(raw.kcal    / DEFAULT_SERVINGS),
                  protein: Math.round(raw.protein / DEFAULT_SERVINGS),
                  carbs:   Math.round(raw.carbs   / DEFAULT_SERVINGS),
                  fat:     Math.round(raw.fat     / DEFAULT_SERVINGS),
                };
                const fitPct = (() => {
                  if (!macroProfile || !dayMeals) return null;
                  let sumOther = 0;
                  for (const [sid, m] of Object.entries(dayMeals)) {
                    if (sid === slot.id || !m) continue;
                    const k = m.id ?? m.name;
                    const r = k ? (getNutritionFromCache(k) ?? nutritionMap?.[k]) : null;
                    if (r) sumOther += r.protein / DEFAULT_SERVINGS;
                  }
                  const remaining = Math.max(macroProfile.protein - sumOther, 1);
                  const pct = Math.min(Math.round((n.protein / remaining) * 100), 100);
                  return pct > 0 ? pct : null;
                })();
                return (
                  <>
                    <span className="plan-slot-macros">
                      ~{n.kcal} kcal&ensp;
                      <span className="macro-tag macro-tag--pro">{n.protein}g pro</span>
                      <span className="macro-tag macro-tag--carb">{n.carbs}g carb</span>
                      <span className="macro-tag macro-tag--fat">{n.fat}g fat</span>
                    </span>
                    {fitPct !== null && (
                      <span className="plan-slot-fit">▸ fills {fitPct}% of remaining protein</span>
                    )}
                  </>
                );
              })()}
            </div>
            <div className="plan-slot-actions">
              <div className="slot-filter-wrap">
                <button
                  className={`plan-slot-btn plan-slot-btn--filter ${hasFilters ? 'active' : ''}`}
                  onClick={openFilter}
                  title="Roll filters"
                >
                  <SlidersHorizontal size={12} strokeWidth={2} />
                </button>
                {filterOpen && (
                  <SlotFilterPopover
                    slotId={slot.id}
                    filters={filters}
                    categories={categories}
                    onChange={handleFilterChange}
                    onClose={() => setFilterOpen(false)}
                    rect={filterRect}
                  />
                )}
              </div>
              <button className="plan-slot-btn plan-slot-btn--reroll" onClick={() => onReroll(date, slot.id)} title="Re-roll">
                <RotateCcw size={12} strokeWidth={2} />
              </button>
              <button className="plan-slot-btn plan-slot-btn--remove" onClick={() => onRemove(date, slot.id)} title="Remove meal">
                <X size={12} strokeWidth={2} />
              </button>
            </div>
          </div>
        ) : (
          <div className="plan-slot-card-meal">
            <span className="plan-slot-empty-label">No meal planned</span>
            <div className="plan-slot-actions">
              <div className="slot-filter-wrap">
                <button
                  className={`plan-slot-btn plan-slot-btn--filter ${hasFilters ? 'active' : ''}`}
                  onClick={openFilter}
                  title="Roll filters"
                >
                  <SlidersHorizontal size={12} strokeWidth={2} />
                </button>
                {filterOpen && (
                  <SlotFilterPopover
                    slotId={slot.id}
                    filters={filters}
                    categories={categories}
                    onChange={handleFilterChange}
                    onClose={() => setFilterOpen(false)}
                    rect={filterRect}
                  />
                )}
              </div>
              <button className="plan-slot-btn plan-slot-btn--reroll" onClick={() => onReroll(date, slot.id)} title="Roll a meal">
                <RotateCcw size={12} strokeWidth={2} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AddSlotDropdown({ date, daySlots, allSlots, onAdd, onClose }) {
  const available = allSlots.filter((s) => !daySlots.some((d) => d.id === s.id));
  return (
    <>
      <div className="plan-add-slot-backdrop" onClick={onClose} />
      <div className="plan-add-slot-dropdown">
        {available.length > 0 ? (
          available.map((slot) => (
            <button key={slot.id} className="plan-add-slot-option" onClick={() => { onAdd(date, slot); onClose(); }}>
              {slot.label}
            </button>
          ))
        ) : (
          <span className="plan-add-slot-none">All default slots added</span>
        )}
      </div>
    </>
  );
}

export function FoodList({ startDate, endDate }) {
  const { categories } = useFilterContext();
  const { effectiveMacroProfile } = useMacroContext();
  const {
    mealplan, slots,
    getDaySlots, rerollingKey,
    slotFilters, nutritionMap,
    handleReroll, handleRemoveMeal,
    handleAddSlotToDay, handleRemoveSlotFromDay,
    handleSlotFilterChange,
  } = useMealPlanContext();

  const [detailMeal, setDetailMeal] = useState(null);
  const [addSlotOpen, setAddSlotOpen] = useState(null);

  const dates = getDatesInRange(new Date(startDate), new Date(endDate))
    .map((d) => d.toISOString().slice(0, 10));

  return (
    <>
      <div className="plan-grid">
        {dates.map((date) => {
          const dayMeals = mealplan[date] || {};
          const daySlots = getDaySlots(date);
          const isToday = date === new Date().toISOString().slice(0, 10);

          return (
            <div key={date} className={`plan-day-card${isToday ? ' plan-day-card--today' : ''}`}>
              <div className="plan-day-header">
                <span className="plan-day-label">{formatDate(date)}</span>
                {isToday && <span className="plan-day-today-badge">Today</span>}
              </div>

              <div className="plan-slot-list">
                {daySlots.map((slot) => {
                  const meal = dayMeals[slot.id];
                  const key = `${date}-${slot.id}`;
                  return (
                    <SlotCard
                      key={slot.id}
                      slot={slot}
                      meal={meal}
                      isRerolling={rerollingKey === key}
                      date={date}
                      onReroll={handleReroll}
                      onRemove={handleRemoveMeal}
                      onRemoveSlot={handleRemoveSlotFromDay}
                      onDetail={setDetailMeal}
                      categories={categories}
                      slotFilter={slotFilters?.[slot.id]}
                      onSlotFilterChange={handleSlotFilterChange}
                      nutritionMap={nutritionMap}
                      macroProfile={effectiveMacroProfile}
                      dayMeals={dayMeals}
                    />
                  );
                })}
              </div>

              <div className="plan-day-footer">
                <div className="plan-add-slot-wrap">
                  <button className="plan-add-slot-btn" onClick={() => setAddSlotOpen(addSlotOpen === date ? null : date)}>
                    + Add slot
                  </button>
                  {addSlotOpen === date && (
                    <AddSlotDropdown
                      date={date}
                      daySlots={daySlots}
                      allSlots={slots}
                      onAdd={handleAddSlotToDay}
                      onClose={() => setAddSlotOpen(null)}
                    />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {detailMeal && (
        <RecipeDetailModal meal={detailMeal} onClose={() => setDetailMeal(null)} onAddToDate={null} />
      )}
    </>
  );
}
