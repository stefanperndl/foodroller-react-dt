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
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>Add "{meal.name}" to Plan</h3>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="date-select">Date</label>
            <input
              id="date-select"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              required
              className="date-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="slot-select">Meal slot</label>
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

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Add to Plan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
