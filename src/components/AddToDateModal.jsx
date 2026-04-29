import { useState } from 'react';

export default function AddToDateModal({ meal, slots, onConfirm, onCancel }) {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(slots[0]?.id ?? 'dinner');

  const sortedSlots = [...slots].sort((a, b) => a.order - b.order);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedDate && selectedSlot) {
      onConfirm(selectedDate, selectedSlot, meal);
    }
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal modal--sm" onClick={(e) => e.stopPropagation()}>
        <button className="modal__close" onClick={onCancel} aria-label="Close">✕</button>
        <div className="add-modal">
          {meal.image && (
            <div className="add-modal__meal">
              <img className="add-modal__thumb" src={meal.image} alt={meal.name} />
              <div className="add-modal__name">{meal.name}</div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="add-modal__label">Choose a date</div>
            <div className="form-group">
              <input
                id="date-select"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                required
                className="date-input"
              />
            </div>

            <div className="add-modal__label" style={{ marginTop: 12 }}>Meal slot</div>
            <div className="form-group">
              <select
                id="slot-select"
                value={selectedSlot}
                onChange={(e) => setSelectedSlot(e.target.value)}
                className="date-input"
              >
                {sortedSlots.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>

            <div className="modal-actions" style={{ marginTop: 16 }}>
              <button type="button" className="btn btn--outline" onClick={onCancel}>
                Cancel
              </button>
              <button type="submit" className="btn btn--primary">
                Add to Plan
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
