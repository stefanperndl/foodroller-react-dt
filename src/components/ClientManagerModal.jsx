'use client';
import { useState } from 'react';
import { DIETARY_RESTRICTIONS } from '../utils/dietaryRestrictions';
import { useMacroContext } from '../context/MacroContext';

const GOALS = [
  { key: 'lose',     label: 'Lose weight' },
  { key: 'maintain', label: 'Maintain' },
  { key: 'gain',     label: 'Gain muscle' },
];

const EMPTY_FORM = { name: '', kcal: '', protein: '', carbs: '', fat: '', goal: 'lose', restrictions: [], notes: '' };

function ClientRow({ client, onEdit, onSelectClient, pendingDelete, onDeleteRequest, onDeleteConfirm, onDeleteCancel }) {
  return (
    <div className="cm-client-row">
      <div className="cm-client-name">{client.name}</div>
      <div className="cm-client-macros">
        {client.kcal} kcal · {client.protein}g P · {client.carbs}g C · {client.fat}g F
      </div>
      {pendingDelete === client.id ? (
        <div className="cm-delete-confirm">
          Delete {client.name}?{' '}
          <button type="button" className="cm-delete-cancel-btn" onClick={onDeleteCancel}>Cancel</button>
          {' '}
          <button type="button" className="cm-delete-confirm-btn" onClick={() => onDeleteConfirm(client.id)}>Delete</button>
        </div>
      ) : (
        <div className="cm-client-actions">
          <button type="button" className="cm-action-btn" onClick={() => onSelectClient(client)}>
            Plan for client →
          </button>
          <button type="button" className="cm-icon-btn" onClick={() => onEdit(client)} aria-label="Edit client">
            ✎
          </button>
          <button type="button" className="cm-icon-btn cm-icon-btn--danger" onClick={() => onDeleteRequest(client.id)} aria-label="Delete client">
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

export default function ClientManagerModal({ onClose }) {
  const { clients, addClient, updateClient, deleteClient, setActiveClient } = useMacroContext();
  const [mode, setMode] = useState('list');
  const [editTarget, setEditTarget] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function toggleRestriction(key) {
    setForm((f) => ({
      ...f,
      restrictions: f.restrictions.includes(key)
        ? f.restrictions.filter((r) => r !== key)
        : [...f.restrictions, key],
    }));
  }

  function openAdd() {
    setForm(EMPTY_FORM);
    setEditTarget(null);
    setMode('add');
  }

  function openEdit(client) {
    setForm({
      name:         client.name,
      kcal:         client.kcal,
      protein:      client.protein,
      carbs:        client.carbs,
      fat:          client.fat,
      goal:         client.goal ?? 'lose',
      restrictions: client.restrictions ?? [],
      notes:        client.notes ?? '',
    });
    setEditTarget(client);
    setMode('edit');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const data = {
      name:         form.name.trim(),
      kcal:         Number(form.kcal),
      protein:      Number(form.protein),
      carbs:        Number(form.carbs),
      fat:          Number(form.fat),
      goal:         form.goal,
      restrictions: form.restrictions,
      notes:        form.notes.trim(),
    };
    setSaving(true);
    try {
      if (mode === 'add') await addClient(data);
      else await updateClient(editTarget.id, data);
      setMode('list');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteConfirm(id) {
    await deleteClient(id);
    setPendingDelete(null);
  }

  const showForm = mode === 'add' || mode === 'edit';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content client-manager-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close">×</button>

        <div className="cm-sidebar">
          <div className="cm-sidebar-header">
            <span className="cm-sidebar-title">Clients</span>
            <button type="button" className="cm-add-btn" onClick={openAdd} aria-label="Add client">+ Add</button>
          </div>
          {clients.length === 0 ? (
            <p className="cm-empty">No clients yet. Add one to get started.</p>
          ) : (
            clients.map((client) => (
              <ClientRow
                key={client.id}
                client={client}
                onEdit={openEdit}
                onSelectClient={(c) => { setActiveClient(c); onClose(); }}
                pendingDelete={pendingDelete}
                onDeleteRequest={setPendingDelete}
                onDeleteConfirm={handleDeleteConfirm}
                onDeleteCancel={() => setPendingDelete(null)}
              />
            ))
          )}
        </div>

        <div className="cm-form">
          {!showForm ? (
            <div className="cm-form-placeholder">
              <p>Select a client to plan on their behalf, or add a new client.</p>
            </div>
          ) : (
            <>
              <div className="cm-form-title">{mode === 'add' ? 'New client' : `Edit — ${editTarget.name}`}</div>
              <form onSubmit={handleSubmit}>
                <div className="macro-calc-field">
                  <label htmlFor="cm-name">Name</label>
                  <input
                    id="cm-name"
                    type="text"
                    className="macro-calc-input"
                    value={form.name}
                    onChange={(e) => set('name', e.target.value)}
                    required
                    placeholder="Client name"
                  />
                </div>

                <div className="macro-goal-tabs" style={{ marginTop: 14 }}>
                  {GOALS.map((g) => (
                    <button
                      key={g.key}
                      type="button"
                      className={`macro-goal-tab${form.goal === g.key ? ' active' : ''}`}
                      onClick={() => set('goal', g.key)}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>

                <div className="macro-targets-grid" style={{ marginTop: 14 }}>
                  <div className="macro-target-field">
                    <label htmlFor="cm-kcal">kcal / day</label>
                    <input id="cm-kcal" type="number" min="800" max="6000" className="macro-calc-input" value={form.kcal} onChange={(e) => set('kcal', e.target.value)} required />
                  </div>
                  <div className="macro-target-field">
                    <label htmlFor="cm-protein">Protein (g)</label>
                    <input id="cm-protein" type="number" min="0" max="500" className="macro-calc-input" value={form.protein} onChange={(e) => set('protein', e.target.value)} required />
                  </div>
                  <div className="macro-target-field">
                    <label htmlFor="cm-carbs">Carbs (g)</label>
                    <input id="cm-carbs" type="number" min="0" max="1000" className="macro-calc-input" value={form.carbs} onChange={(e) => set('carbs', e.target.value)} required />
                  </div>
                  <div className="macro-target-field">
                    <label htmlFor="cm-fat">Fat (g)</label>
                    <input id="cm-fat" type="number" min="0" max="300" className="macro-calc-input" value={form.fat} onChange={(e) => set('fat', e.target.value)} required />
                  </div>
                </div>

                <div style={{ marginTop: 14 }}>
                  <label style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dietary restrictions</label>
                  <div className="cm-restrictions">
                    {Object.entries(DIETARY_RESTRICTIONS).map(([key, r]) => (
                      <button
                        key={key}
                        type="button"
                        className={`cm-restriction-chip${form.restrictions.includes(key) ? ' active' : ''}`}
                        onClick={() => toggleRestriction(key)}
                      >
                        {r.icon} {r.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="macro-calc-field" style={{ marginTop: 8 }}>
                  <label htmlFor="cm-notes">Notes</label>
                  <textarea
                    id="cm-notes"
                    className="macro-calc-input cm-notes"
                    value={form.notes}
                    onChange={(e) => set('notes', e.target.value)}
                    placeholder="Allergies, preferences, goals…"
                    rows={2}
                  />
                </div>

                <div className="cm-form-actions">
                  <button type="button" className="cm-cancel-btn" onClick={() => setMode('list')}>Cancel</button>
                  <button type="submit" className="macro-save-btn cm-save-btn" disabled={saving}>
                    {saving ? 'Saving…' : mode === 'add' ? 'Add client' : 'Save changes'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
