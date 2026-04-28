'use client';
import { useState, useEffect } from 'react';
import { getDatesInRange } from '../utils/utils';
import { getNutrition, getNutritionFromCache } from '../api/nutrition';

const DEFAULT_SERVINGS = 4;

function pct(value, target) {
  if (!target) return 0;
  return Math.min((value / target) * 100, 100);
}

function statusColor(value, target) {
  if (!target || value === 0) return '#d1d5db';
  const ratio = value / target;
  if (ratio >= 0.8 && ratio <= 1.1) return '#16a34a';
  if (ratio >= 0.6 && ratio <= 1.3) return '#d97706';
  return '#dc2626';
}

function MacroBar({ label, value, target, unit = 'g', color }) {
  return (
    <div className="macro-bar-row">
      <span className="macro-bar-label">{label}</span>
      <div className="macro-bar-track">
        <div
          className="macro-bar-fill"
          style={{ width: `${pct(value, target)}%`, background: color }}
        />
      </div>
      <span className="macro-bar-value">{value}<span className="macro-bar-unit">{unit}</span></span>
      <span className="macro-bar-target">/ {target}{unit}</span>
    </div>
  );
}

function SlotRow({ slotLabel, meal, n, loading }) {
  return (
    <div className="day-slot-row">
      <div className="day-slot-header">
        <span className="day-slot-label">{slotLabel}</span>
        <span className="day-slot-meal">{meal?.name ?? <em className="day-slot-empty">No meal</em>}</span>
      </div>
      {meal && loading && <p className="day-card-no-nutrition">Loading nutrition…</p>}
      {meal && n && (
        <div className="day-slot-macros">
          <span className="day-slot-macro">{n.kcal} kcal</span>
          <span className="day-slot-macro">{n.protein}g P</span>
          <span className="day-slot-macro">{n.carbs}g C</span>
          <span className="day-slot-macro">{n.fat}g F</span>
        </div>
      )}
    </div>
  );
}

function DayCard({ date, slots, mealplanDay, profile, nutritionMap }) {
  const d = new Date(date + 'T12:00:00');
  const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  const slotData = slots.map((slot) => {
    const meal = mealplanDay?.[slot.id] ?? null;
    const cacheKey = meal ? (meal.id ?? meal.name) : null;
    const raw = cacheKey ? (getNutritionFromCache(cacheKey) ?? nutritionMap[cacheKey] ?? null) : null;
    const n = raw ? {
      kcal:    Math.round(raw.kcal    / DEFAULT_SERVINGS),
      protein: Math.round(raw.protein / DEFAULT_SERVINGS),
      carbs:   Math.round(raw.carbs   / DEFAULT_SERVINGS),
      fat:     Math.round(raw.fat     / DEFAULT_SERVINGS),
    } : null;
    const loading = meal && !n;
    return { slot, meal, n, loading };
  });

  const hasAnyMeal = slotData.some((s) => s.meal);

  // Day total across all slots that have nutrition data
  let total = null;
  for (const { n } of slotData) {
    if (!n) continue;
    if (!total) total = { kcal: 0, protein: 0, carbs: 0, fat: 0 };
    total.kcal    += n.kcal;
    total.protein += n.protein;
    total.carbs   += n.carbs;
    total.fat     += n.fat;
  }

  return (
    <div className={`day-card ${!hasAnyMeal ? 'day-card-empty' : ''}`}>
      <div className="day-card-header">
        <span className="day-card-date">{dayLabel}</span>
      </div>
      <div className="day-card-slots">
        {slotData.map(({ slot, meal, n, loading }) => (
          <SlotRow
            key={slot.id}
            slotLabel={slot.label}
            meal={meal}
            n={n}
            loading={loading}
          />
        ))}
      </div>
      {total && (
        <div className="day-card-total">
          <span className="day-card-total-label">Daily total</span>
          <div className="day-card-bars">
            <MacroBar label="kcal" value={total.kcal}    target={profile.kcal}    unit=""  color={statusColor(total.kcal,    profile.kcal)} />
            <MacroBar label="P"    value={total.protein}  target={profile.protein} unit="g" color={statusColor(total.protein, profile.protein)} />
            <MacroBar label="C"    value={total.carbs}    target={profile.carbs}   unit="g" color={statusColor(total.carbs,   profile.carbs)} />
            <MacroBar label="F"    value={total.fat}      target={profile.fat}     unit="g" color={statusColor(total.fat,     profile.fat)} />
          </div>
        </div>
      )}
    </div>
  );
}

function WeekSummary({ days, profile }) {
  const daysWithData = days.filter((d) => d.total);
  if (daysWithData.length === 0) return null;

  const totals = daysWithData.reduce(
    (acc, d) => ({
      kcal:    acc.kcal    + d.total.kcal,
      protein: acc.protein + d.total.protein,
      carbs:   acc.carbs   + d.total.carbs,
      fat:     acc.fat     + d.total.fat,
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  );
  const count = daysWithData.length;
  const avg = {
    kcal:    Math.round(totals.kcal    / count),
    protein: Math.round(totals.protein / count),
    carbs:   Math.round(totals.carbs   / count),
    fat:     Math.round(totals.fat     / count),
  };

  return (
    <div className="week-summary">
      <h3 className="week-summary-title">Daily average ({count} day{count !== 1 ? 's' : ''} with data)</h3>
      <div className="week-summary-bars">
        <MacroBar label="kcal" value={avg.kcal}    target={profile.kcal}    unit=""  color={statusColor(avg.kcal,    profile.kcal)} />
        <MacroBar label="P"    value={avg.protein}  target={profile.protein} unit="g" color={statusColor(avg.protein, profile.protein)} />
        <MacroBar label="C"    value={avg.carbs}    target={profile.carbs}   unit="g" color={statusColor(avg.carbs,   profile.carbs)} />
        <MacroBar label="F"    value={avg.fat}      target={profile.fat}     unit="g" color={statusColor(avg.fat,     profile.fat)} />
      </div>
      <p className="week-summary-note">Based on 1 serving per meal (default 4-serving recipe ÷ 4)</p>
    </div>
  );
}

export default function MacroDashboard({ mealplan, macroProfile, startDate, endDate, slots }) {
  const [nutritionMap, setNutritionMap] = useState({});

  const dates = getDatesInRange(new Date(startDate), new Date(endDate))
    .map((d) => d.toISOString().slice(0, 10));

  const sortedSlots = [...(slots || [])].sort((a, b) => a.order - b.order);

  function allMeals() {
    const meals = [];
    for (const date of dates) {
      const daySlots = mealplan[date] || {};
      for (const meal of Object.values(daySlots)) {
        if (meal?.ingredients?.length) meals.push(meal);
      }
    }
    return meals;
  }

  useEffect(() => {
    let cancelled = false;
    const meals = allMeals()
      .map((m) => ({ ...m, cacheKey: m.id ?? m.name }))
      .filter((m) => !getNutritionFromCache(m.cacheKey));

    if (meals.length === 0) return;

    Promise.all(
      meals.map((m) =>
        getNutrition(m.cacheKey, m.ingredients)
          .then((n) => ({ key: m.cacheKey, n }))
          .catch(() => null)
      )
    ).then((results) => {
      if (cancelled) return;
      const map = {};
      results.forEach((r) => { if (r) map[r.key] = r.n; });
      setNutritionMap((prev) => ({ ...prev, ...map }));
    });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, mealplan]);

  if (!macroProfile) {
    return (
      <div className="macro-dashboard-empty">
        <p>Set your nutrition goals to see macro tracking.</p>
      </div>
    );
  }

  const days = dates.map((date) => {
    const daySlotMap = mealplan[date] || {};
    let total = null;
    for (const slot of sortedSlots) {
      const meal = daySlotMap[slot.id];
      if (!meal) continue;
      const cacheKey = meal.id ?? meal.name;
      const raw = getNutritionFromCache(cacheKey) ?? nutritionMap[cacheKey];
      if (raw) {
        if (!total) total = { kcal: 0, protein: 0, carbs: 0, fat: 0 };
        total.kcal    += Math.round(raw.kcal    / DEFAULT_SERVINGS);
        total.protein += Math.round(raw.protein / DEFAULT_SERVINGS);
        total.carbs   += Math.round(raw.carbs   / DEFAULT_SERVINGS);
        total.fat     += Math.round(raw.fat     / DEFAULT_SERVINGS);
      }
    }
    return { date, total };
  });

  return (
    <div className="macro-dashboard">
      <div className="macro-dashboard-days">
        {dates.map((date) => (
          <DayCard
            key={date}
            date={date}
            slots={sortedSlots}
            mealplanDay={mealplan[date] || {}}
            profile={macroProfile}
            nutritionMap={nutritionMap}
          />
        ))}
      </div>
      <WeekSummary days={days} profile={macroProfile} />
    </div>
  );
}
