'use client';
import { useState } from 'react';
import { generateMealPlan } from '../api/planner';

export default function PlannerModal({
  macroProfile,
  startDate,
  endDate,
  selectedCategories,
  selectedRestrictions,
  slots,
  onApply,
  onClose,
}) {
  const sortedSlots = [...slots].sort((a, b) => a.order - b.order);
  const [status, setStatus]     = useState('idle');
  const [progress, setProgress] = useState('');
  const [plan, setPlan]         = useState(null);
  const [error, setError]       = useState('');

  async function handleGenerate() {
    setStatus('generating');
    setError('');
    setPlan(null);
    try {
      const result = await generateMealPlan({
        startDate,
        endDate,
        macroProfile,
        selectedCategories,
        selectedRestrictions,
        slots: sortedSlots,
        onProgress: setProgress,
      });
      setPlan(result);
      setStatus('done');
    } catch (e) {
      setError(e.message);
      setStatus('error');
    }
  }

  function handleApply() {
    onApply(plan);
    onClose();
  }

  const dateEntries = plan ? Object.entries(plan).sort(([a], [b]) => a.localeCompare(b)) : [];

  return (
    <div className="modal-overlay" data-testid="planner-overlay" onClick={onClose}>
      <div className="modal-content planner-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close">×</button>
        <h2 className="planner-title">AI Meal Planner</h2>

        <div className="planner-targets">
          <span>{macroProfile.kcal} kcal</span>
          <span>{macroProfile.protein}g protein</span>
          <span>{macroProfile.carbs}g carbs</span>
          <span>{macroProfile.fat}g fat</span>
        </div>

        {status === 'idle' && (
          <div className="planner-idle">
            <p className="planner-description">
              Claude will fill all {sortedSlots.length} slot{sortedSlots.length !== 1 ? 's' : ''} ({sortedSlots.map((s) => s.label).join(', ')}) for each day in your timeframe so that the combined daily macros hit your targets.
            </p>
            <button className="planner-generate-btn" onClick={handleGenerate}>
              Generate plan
            </button>
          </div>
        )}

        {status === 'generating' && (
          <div className="planner-generating">
            <div className="planner-spinner" data-testid="planner-spinner" />
            <p className="planner-progress">{progress}</p>
          </div>
        )}

        {status === 'error' && (
          <div className="planner-error">
            <p>{error}</p>
            <button className="planner-generate-btn" onClick={handleGenerate}>Try again</button>
          </div>
        )}

        {status === 'done' && plan && (
          <>
            <div className="planner-results">
              {dateEntries.map(([date, daySlots]) => {
                const d = new Date(date + 'T12:00:00');
                const label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                return (
                  <div key={date} className="planner-result-day">
                    <span className="planner-result-date">{label}</span>
                    <div className="planner-result-slots">
                      {sortedSlots.map((slot) => {
                        const recipe = daySlots[slot.id];
                        if (!recipe) return null;
                        return (
                          <div key={slot.id} className="planner-result-row">
                            <span className="planner-result-slot-label">{slot.label}</span>
                            <span className="planner-result-meal">{recipe.name}</span>
                            {recipe.nutrition && (
                              <span className="planner-result-macros">
                                {recipe.nutrition.kcal} kcal · {recipe.nutrition.protein}g P
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="planner-actions">
              <button className="planner-secondary-btn" onClick={handleGenerate}>Regenerate</button>
              <button className="planner-apply-btn" onClick={handleApply}>Apply to plan</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
