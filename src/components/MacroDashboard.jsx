'use client';
import { getDatesInRange } from '../utils/utils';
import { getNutritionFromCache } from '../api/nutrition';

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

function DayCard({ date, meal, profile }) {
  const nutrition = meal?.id ? getNutritionFromCache(meal.id) : null;
  const n = nutrition
    ? {
        kcal:    Math.round(nutrition.kcal    / DEFAULT_SERVINGS),
        protein: Math.round(nutrition.protein / DEFAULT_SERVINGS),
        carbs:   Math.round(nutrition.carbs   / DEFAULT_SERVINGS),
        fat:     Math.round(nutrition.fat     / DEFAULT_SERVINGS),
      }
    : null;

  const d = new Date(date + 'T12:00:00');
  const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <div className={`day-card ${!meal ? 'day-card-empty' : ''}`}>
      <div className="day-card-header">
        <span className="day-card-date">{dayLabel}</span>
        <span className="day-card-meal">{meal?.name ?? 'No meal planned'}</span>
      </div>
      {meal && !n && (
        <p className="day-card-no-nutrition">Open recipe to load nutrition data</p>
      )}
      {n && (
        <div className="day-card-bars">
          <MacroBar label="kcal" value={n.kcal}    target={profile.kcal}    unit=""  color={statusColor(n.kcal,    profile.kcal)} />
          <MacroBar label="P"    value={n.protein}  target={profile.protein} unit="g" color={statusColor(n.protein, profile.protein)} />
          <MacroBar label="C"    value={n.carbs}    target={profile.carbs}   unit="g" color={statusColor(n.carbs,   profile.carbs)} />
          <MacroBar label="F"    value={n.fat}      target={profile.fat}     unit="g" color={statusColor(n.fat,     profile.fat)} />
        </div>
      )}
    </div>
  );
}

function WeekSummary({ days, profile }) {
  const daysWithData = days.filter((d) => d.n);
  if (daysWithData.length === 0) return null;

  const totals = daysWithData.reduce(
    (acc, d) => ({
      kcal:    acc.kcal    + d.n.kcal,
      protein: acc.protein + d.n.protein,
      carbs:   acc.carbs   + d.n.carbs,
      fat:     acc.fat     + d.n.fat,
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

export default function MacroDashboard({ mealplan, macroProfile, startDate, endDate }) {
  if (!macroProfile) {
    return (
      <div className="macro-dashboard-empty">
        <p>Set your nutrition goals to see macro tracking.</p>
      </div>
    );
  }

  const dates = getDatesInRange(new Date(startDate), new Date(endDate))
    .map((d) => d.toISOString().slice(0, 10));

  const days = dates.map((date) => {
    const meal = mealplan[date] ?? null;
    const nutrition = meal?.id ? getNutritionFromCache(meal.id) : null;
    const n = nutrition
      ? {
          kcal:    Math.round(nutrition.kcal    / DEFAULT_SERVINGS),
          protein: Math.round(nutrition.protein / DEFAULT_SERVINGS),
          carbs:   Math.round(nutrition.carbs   / DEFAULT_SERVINGS),
          fat:     Math.round(nutrition.fat     / DEFAULT_SERVINGS),
        }
      : null;
    return { date, meal, n };
  });

  return (
    <div className="macro-dashboard">
      <div className="macro-dashboard-days">
        {days.map(({ date, meal }) => (
          <DayCard key={date} date={date} meal={meal} profile={macroProfile} />
        ))}
      </div>
      <WeekSummary days={days} profile={macroProfile} />
    </div>
  );
}
