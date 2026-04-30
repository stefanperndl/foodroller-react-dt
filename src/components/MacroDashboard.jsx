'use client';
import { useState, useEffect } from 'react';
import { getDatesInRange } from '../utils/utils';
import { getNutrition, getNutritionFromCache, DEFAULT_SERVINGS, MIN_KCAL_TOTAL } from '../api/nutrition';


function pct(value, target) {
  if (!target || value === 0) return 0;
  return Math.min((value / target) * 100, 100);
}

function statusColor(value, target) {
  if (!target || value === 0) return 'var(--border)';
  const r = value / target;
  if (r >= 0.8 && r <= 1.1) return 'oklch(52% 0.14 148)';
  if (r >= 0.6 && r <= 1.3) return 'oklch(70% 0.17 65)';
  return 'oklch(55% 0.19 25)';
}

function MacroRing({ value, target, color, label, unit = 'g' }) {
  const r = 22;
  const circ = 2 * Math.PI * r;
  const fill = circ * (1 - pct(value, target) / 100);
  return (
    <div className="macro-ring-cell">
      <svg width="56" height="56" viewBox="0 0 56 56">
        <circle cx="28" cy="28" r={r} fill="none" stroke="var(--border)" strokeWidth="5" />
        <circle
          cx="28" cy="28" r={r} fill="none"
          stroke={color} strokeWidth="5"
          strokeDasharray={circ}
          strokeDashoffset={fill}
          strokeLinecap="round"
          transform="rotate(-90 28 28)"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
        <text x="28" y="30" textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--text)" fontFamily="var(--font-body)">
          {value}{unit === 'g' ? 'g' : ''}
        </text>
      </svg>
      <span className="macro-ring-label">{label}</span>
      <span className="macro-ring-target">/{target}{unit}</span>
    </div>
  );
}

function DayCard({ date, slots, mealplanDay, profile, nutritionMap }) {
  const d = new Date(date + 'T12:00:00');
  const isToday = date === new Date().toISOString().slice(0, 10);
  const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  let total = null;
  const slotRows = slots.map((slot) => {
    const meal = mealplanDay?.[slot.id] ?? null;
    const key = meal ? (meal.id ?? meal.name) : null;
    const raw = key ? (getNutritionFromCache(key) ?? nutritionMap?.[key] ?? null) : null;
    const n = (raw && raw.kcal >= MIN_KCAL_TOTAL) ? {
      kcal:    Math.round(raw.kcal    / DEFAULT_SERVINGS),
      protein: Math.round(raw.protein / DEFAULT_SERVINGS),
      carbs:   Math.round(raw.carbs   / DEFAULT_SERVINGS),
      fat:     Math.round(raw.fat     / DEFAULT_SERVINGS),
    } : null;
    if (n) {
      if (!total) total = { kcal: 0, protein: 0, carbs: 0, fat: 0 };
      total.kcal    += n.kcal;
      total.protein += n.protein;
      total.carbs   += n.carbs;
      total.fat     += n.fat;
    }
    return { slot, meal, n };
  });

  return (
    <div className={`mdb-day-card${isToday ? ' mdb-day-card--today' : ''}${!slotRows.some(s => s.meal) ? ' mdb-day-card--empty' : ''}`}>
      <div className="mdb-day-header">
        <span className="mdb-day-label">{dayLabel}</span>
        {isToday && <span className="mdb-today-badge">Today</span>}
      </div>

      <div className="mdb-slots">
        {slotRows.map(({ slot, meal, n }) => (
          <div key={slot.id} className="mdb-slot-row">
            <span className="mdb-slot-name">{slot.label}</span>
            <span className="mdb-slot-meal">{meal?.name ?? <em className="mdb-slot-empty">—</em>}</span>
            {n && (
              <span className="mdb-slot-nums">{n.kcal} kcal · {n.protein}g pro · {n.carbs}g carb · {n.fat}g fat</span>
            )}
          </div>
        ))}
      </div>

      {total && profile && (
        <div className="mdb-totals">
          <div className="mdb-rings">
            <MacroRing value={total.kcal}    target={profile.kcal}    color={statusColor(total.kcal,    profile.kcal)}    label="kcal"  unit="" />
            <MacroRing value={total.protein} target={profile.protein} color={statusColor(total.protein, profile.protein)} label="pro"   unit="g" />
            <MacroRing value={total.carbs}   target={profile.carbs}   color={statusColor(total.carbs,   profile.carbs)}   label="carbs" unit="g" />
            <MacroRing value={total.fat}     target={profile.fat}     color={statusColor(total.fat,     profile.fat)}     label="fat"   unit="g" />
          </div>
        </div>
      )}
    </div>
  );
}

export default function MacroDashboard({ mealplan, macroProfile, startDate, endDate, slots, nutritionMap: propMap }) {
  const [localMap, setLocalMap] = useState({});
  const nutritionMap = { ...localMap, ...propMap };

  const dates = getDatesInRange(new Date(startDate), new Date(endDate))
    .map((d) => d.toISOString().slice(0, 10));

  const sortedSlots = [...(slots || [])].sort((a, b) => a.order - b.order);

  useEffect(() => {
    let cancelled = false;
    const meals = [];
    for (const date of dates) {
      for (const meal of Object.values(mealplan[date] || {})) {
        if (meal?.ingredients?.length) meals.push(meal);
      }
    }
    const uncached = meals.filter((m) => {
      const k = m.id ?? m.name;
      return k && !getNutritionFromCache(k) && !propMap?.[k] && !localMap[k];
    });
    if (!uncached.length) return;
    Promise.all(
      uncached.map((m) =>
        getNutrition(m.id ?? m.name, m.ingredients)
          .then((n) => ({ key: m.id ?? m.name, n }))
          .catch(() => null)
      )
    ).then((results) => {
      if (cancelled) return;
      const map = {};
      results.forEach((r) => { if (r) map[r.key] = r.n; });
      if (Object.keys(map).length) setLocalMap((p) => ({ ...p, ...map }));
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

  return (
    <div className="macro-dashboard">
      <div className="mdb-grid">
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
    </div>
  );
}
