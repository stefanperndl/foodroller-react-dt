'use client';
import { useState } from 'react';
import { ChevronUp, ChevronDown, X } from 'lucide-react';
import { newSlotId } from '../hooks/useMealSlots';

export default function SlotManagerModal({ slots, onSave, onClose }) {
  const [draft, setDraft] = useState(slots.map((s) => ({ ...s })));
  const [editingId, setEditingId] = useState(null);
  const [editLabel, setEditLabel] = useState('');

  function startEdit(slot) {
    setEditingId(slot.id);
    setEditLabel(slot.label);
  }

  function commitEdit(id) {
    if (editLabel.trim()) {
      setDraft((prev) => prev.map((s) => s.id === id ? { ...s, label: editLabel.trim() } : s));
    }
    setEditingId(null);
  }

  function moveSlot(idx, dir) {
    setDraft((prev) => {
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next.map((s, i) => ({ ...s, order: i }));
    });
  }

  function removeSlot(id) {
    setDraft((prev) => prev.filter((s) => s.id !== id).map((s, i) => ({ ...s, order: i })));
  }

  function addSlot() {
    setDraft((prev) => [
      ...prev,
      { id: newSlotId(), label: 'New Meal', order: prev.length },
    ]);
  }

  function handleSave() {
    onSave(draft.map((s, i) => ({ ...s, order: i })));
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content slot-manager-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close"><X size={16} strokeWidth={1.75} /></button>
        <h2 className="slot-manager-title">Manage Meal Slots</h2>
        <p className="slot-manager-hint">These slots apply to every day in your plan.</p>

        <ul className="slot-manager-list">
          {draft.map((slot, idx) => (
            <li key={slot.id} className="slot-manager-item">
              {editingId === slot.id ? (
                <input
                  className="slot-manager-input"
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  onBlur={() => commitEdit(slot.id)}
                  onKeyDown={(e) => { if (e.key === 'Enter') commitEdit(slot.id); }}
                  autoFocus
                />
              ) : (
                <span className="slot-manager-label" onClick={() => startEdit(slot)}>
                  {slot.label}
                </span>
              )}
              <div className="slot-manager-controls">
                <button
                  className="slot-ctrl-btn"
                  onClick={() => moveSlot(idx, -1)}
                  disabled={idx === 0}
                  title="Move up"
                ><ChevronUp size={14} strokeWidth={2} /></button>
                <button
                  className="slot-ctrl-btn"
                  onClick={() => moveSlot(idx, 1)}
                  disabled={idx === draft.length - 1}
                  title="Move down"
                ><ChevronDown size={14} strokeWidth={2} /></button>
                <button
                  className="slot-ctrl-btn slot-ctrl-btn--remove"
                  onClick={() => removeSlot(slot.id)}
                  disabled={draft.length === 1}
                  title="Remove slot"
                ><X size={14} strokeWidth={2} /></button>
              </div>
            </li>
          ))}
        </ul>

        <button className="slot-add-btn" onClick={addSlot}>+ Add slot</button>

        <div className="slot-manager-footer">
          <button className="btn-secondary-action" onClick={onClose}>Cancel</button>
          <button className="macro-save-btn" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
}
