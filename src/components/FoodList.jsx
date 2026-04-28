'use client';
import React, { useState } from 'react';
import { getDatesInRange } from '../utils/utils';
import RecipeDetailModal from './RecipeDetailModal';

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

function MealImage({ src, alt, placeholder }) {
  const [errored, setErrored] = useState(false);
  if (src && !errored) {
    return (
      <img
        src={src}
        alt={alt}
        className="plan-slot-img"
        onError={() => setErrored(true)}
      />
    );
  }
  return (
    <div className="plan-slot-img-placeholder">
      <span>{placeholder}</span>
    </div>
  );
}

function SlotCard({ slot, meal, isRerolling, date, onReroll, onRemove, onRemoveSlot, onDetail }) {
  return (
    <div className={`plan-slot-card${!meal ? ' plan-slot-card--empty' : ''}`}>
      <div className="plan-slot-card-img">
        <MealImage
          src={meal?.image}
          alt={meal?.name ?? slot.label}
          placeholder={slot.label[0]}
        />
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
            <span
              className="plan-slot-meal-name"
              onClick={() => onDetail(meal)}
              title="View recipe"
            >{meal.name}</span>
            <div className="plan-slot-actions">
              <button className="plan-slot-btn plan-slot-btn--reroll" onClick={() => onReroll(date, slot.id)} title="Re-roll">↺</button>
              <button className="plan-slot-btn plan-slot-btn--remove" onClick={() => onRemove(date, slot.id)} title="Remove meal">×</button>
            </div>
          </div>
        ) : (
          <div className="plan-slot-card-meal">
            <span className="plan-slot-empty-label">No meal planned</span>
            <button className="plan-slot-btn plan-slot-btn--reroll" onClick={() => onReroll(date, slot.id)} title="Roll a meal">↺</button>
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
            <button
              key={slot.id}
              className="plan-add-slot-option"
              onClick={() => { onAdd(date, slot); onClose(); }}
            >
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

export function FoodList({
  startDate, endDate, mealplan, slots,
  getDaySlots, rerollingKey,
  onReroll, onRemove, onAddSlotToDay, onRemoveSlotFromDay,
}) {
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
                      onReroll={onReroll}
                      onRemove={onRemove}
                      onRemoveSlot={onRemoveSlotFromDay}
                      onDetail={setDetailMeal}
                    />
                  );
                })}
              </div>

              <div className="plan-day-footer">
                <div className="plan-add-slot-wrap">
                  <button
                    className="plan-add-slot-btn"
                    onClick={() => setAddSlotOpen(addSlotOpen === date ? null : date)}
                  >
                    + Add slot
                  </button>
                  {addSlotOpen === date && (
                    <AddSlotDropdown
                      date={date}
                      daySlots={daySlots}
                      allSlots={slots}
                      onAdd={onAddSlotToDay}
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
        <RecipeDetailModal
          meal={detailMeal}
          onClose={() => setDetailMeal(null)}
          onAddToDate={null}
        />
      )}
    </>
  );
}
