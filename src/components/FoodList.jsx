'use client';
import React, { useState } from 'react';
import { getDatesInRange } from '../utils/utils';
import RecipeDetailModal from './RecipeDetailModal';

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

export function FoodList({ startDate, endDate, mealplan, slots, rerollingKey, onReroll, onRemove }) {
  const [detailMeal, setDetailMeal] = useState(null);

  const dates = getDatesInRange(new Date(startDate), new Date(endDate))
    .map((d) => d.toISOString().slice(0, 10));

  const sortedSlots = [...slots].sort((a, b) => a.order - b.order);

  return (
    <>
      <div className="plan-grid">
        {dates.map((date) => {
          const dayMeals = mealplan[date] || {};
          return (
            <div key={date} className="plan-day-card">
              <div className="plan-day-header">{formatDate(date)}</div>
              <div className="plan-slot-list">
                {sortedSlots.map((slot) => {
                  const meal = dayMeals[slot.id];
                  const key = `${date}-${slot.id}`;
                  const isRerolling = rerollingKey === key;
                  return (
                    <div key={slot.id} className={`plan-slot-row ${!meal ? 'plan-slot-row--empty' : ''}`}>
                      <span className="plan-slot-label">{slot.label}</span>
                      {isRerolling ? (
                        <span className="plan-slot-loading">Rolling…</span>
                      ) : meal ? (
                        <div className="plan-slot-meal">
                          <span
                            className="plan-slot-meal-name"
                            onClick={() => setDetailMeal(meal)}
                            title="View details"
                          >
                            {meal.name}
                          </span>
                          <div className="plan-slot-actions">
                            <button
                              className="plan-slot-btn plan-slot-btn--reroll"
                              onClick={() => onReroll(date, slot.id)}
                              title="Re-roll this meal"
                            >
                              ↺
                            </button>
                            <button
                              className="plan-slot-btn plan-slot-btn--remove"
                              onClick={() => onRemove(date, slot.id)}
                              title="Remove meal"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      ) : (
                        <span className="plan-slot-empty-label">— empty —</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {detailMeal && (
        <RecipeDetailModal
          meal={detailMeal}
          onClose={() => setDetailMeal(null)}
          onAddToDate={null}
        />
      )}
    </>
  );
}
