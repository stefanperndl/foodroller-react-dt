import { useState } from 'react';

export default function AddToDateModal({ meal, onConfirm, onCancel }) {
  const [selectedDate, setSelectedDate] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedDate) {
      onConfirm(selectedDate, meal);
    }
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>Add "{meal.name}" to Date</h3>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="date-select">Select Date:</label>
            <input
              id="date-select"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              required
              className="date-input"
            />
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
