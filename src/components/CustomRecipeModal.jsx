'use client';
import { useState, useEffect, useRef } from 'react';
import { DIETARY_RESTRICTIONS } from '../utils/dietaryRestrictions';
import { useMacroContext } from '../context/MacroContext';
import { useFilterContext } from '../context/FilterContext';

function initForm(mode, data) {
  if (!data || mode === 'create') {
    return {
      name: '', category: '', area: '', servings: 4,
      ingredients: [''], instructions: '',
      tags: [], image: '', published: false,
    };
  }
  return {
    name: mode === 'fork' ? `Fork of ${data.name}` : (data.name ?? ''),
    category: data.category ?? '',
    area: data.area ?? '',
    servings: data.servings ?? 4,
    ingredients: data.ingredients?.length ? data.ingredients : [''],
    instructions: data.instructions ?? '',
    tags: data.tags ?? [],
    image: data.image ?? '',
    published: false,
  };
}

export default function CustomRecipeModal({ mode, initialData, onClose, onSaved }) {
  const { addRecipe, updateRecipe } = useMacroContext();
  const { categories } = useFilterContext();

  const [form, setForm] = useState(() => initForm(mode, initialData));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [importUrl, setImportUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const [showImport, setShowImport] = useState(false);

  const [showCategoryList, setShowCategoryList] = useState(false);
  const categoryRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    function handleClick(e) {
      if (categoryRef.current && !categoryRef.current.contains(e.target)) {
        setShowCategoryList(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function toggleTag(key) {
    setForm((f) => ({
      ...f,
      tags: f.tags.includes(key) ? f.tags.filter((t) => t !== key) : [...f.tags, key],
    }));
  }

  function handleIngredientChange(i, val) {
    setForm((f) => ({ ...f, ingredients: f.ingredients.map((x, j) => (j === i ? val : x)) }));
  }

  function handleIngredientKeyDown(e, i) {
    if (e.key === 'Enter') {
      e.preventDefault();
      setForm((f) => ({ ...f, ingredients: [...f.ingredients, ''] }));
      // focus the new row after render
      setTimeout(() => {
        const rows = document.querySelectorAll('.crm-ingredient-input');
        if (rows[i + 1]) rows[i + 1].focus();
      }, 0);
    }
  }

  function handleIngredientRemove(i) {
    setForm((f) => ({
      ...f,
      ingredients: f.ingredients.length > 1 ? f.ingredients.filter((_, j) => j !== i) : f.ingredients,
    }));
  }

  async function handleImport() {
    if (!importUrl.trim()) return;
    setImporting(true);
    setImportError('');
    try {
      const res = await fetch(`/api/import-recipe?url=${encodeURIComponent(importUrl.trim())}`);
      const data = await res.json();
      if (data.error) { setImportError(data.error); return; }
      setForm((f) => ({
        ...f,
        name: data.name || f.name,
        ingredients: data.ingredients?.length ? data.ingredients : f.ingredients,
        instructions: data.instructions || f.instructions,
        image: data.image || f.image,
        category: data.category || f.category,
        servings: data.servings || f.servings,
      }));
      if (data.confidence === 'low') {
        setImportError('Auto-fill may be incomplete — review all fields.');
      } else {
        setShowImport(false);
        setImportUrl('');
      }
    } catch {
      setImportError('Import failed. Try copying ingredients manually.');
    } finally {
      setImporting(false);
    }
  }

  async function handleSave() {
    setError('');
    if (!form.name.trim()) { setError('Name is required.'); return; }
    const cleanIngredients = form.ingredients.filter((s) => s.trim());
    if (!cleanIngredients.length) { setError('Add at least one ingredient.'); return; }

    setSaving(true);
    try {
      const payload = {
        ...form,
        ingredients: cleanIngredients,
        source: mode === 'fork' ? 'fork' : 'custom',
        forkedFrom: mode === 'fork' ? (initialData?.id ?? null) : null,
      };
      const saved = mode === 'edit'
        ? await updateRecipe(initialData.id, payload)
        : await addRecipe(payload);
      onSaved?.(saved);
      onClose();
    } catch {
      setError('Save failed. Please try again.');
      setSaving(false);
    }
  }

  const title = mode === 'edit' ? `Edit — ${initialData?.name}` : mode === 'fork' ? 'Fork Recipe' : 'New Recipe';
  const categoryNames = categories.map((c) => c.strCategory ?? c).filter(Boolean);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-content crm-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close">×</button>

        <div className="crm-header">
          <h2 className="crm-title">{title}</h2>
          {mode === 'fork' && (
            <div className="crm-fork-banner">
              Editing a personal copy — changes only affect your account.
            </div>
          )}
        </div>

        {/* URL import (create/fork mode only) */}
        {mode !== 'edit' && (
          <div className="crm-import-section">
            {!showImport ? (
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => setShowImport(true)}>
                ↓ Import from URL
              </button>
            ) : (
              <div className="crm-import-row">
                <input
                  type="url"
                  className="macro-calc-input crm-import-input"
                  placeholder="https://www.allrecipes.com/recipe/…"
                  value={importUrl}
                  onChange={(e) => setImportUrl(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleImport(); }}
                />
                <button
                  type="button"
                  className="btn btn--primary btn--sm"
                  onClick={handleImport}
                  disabled={importing}
                >
                  {importing ? 'Importing…' : 'Import'}
                </button>
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() => { setShowImport(false); setImportUrl(''); setImportError(''); }}
                >
                  Cancel
                </button>
              </div>
            )}
            {importError && <p className="crm-import-error">{importError}</p>}
          </div>
        )}

        <div className="crm-body">
          {/* Left panel */}
          <div className="crm-left">
            {/* Image */}
            <div className="macro-calc-field">
              <label htmlFor="crm-image">Image URL</label>
              {form.image && (
                <img src={form.image} alt="preview" className="crm-image-preview" />
              )}
              <input
                id="crm-image"
                type="url"
                className="macro-calc-input"
                placeholder="https://…"
                value={form.image}
                onChange={(e) => set('image', e.target.value)}
              />
            </div>

            {/* Name */}
            <div className="macro-calc-field">
              <label htmlFor="crm-name">Name *</label>
              <input
                id="crm-name"
                type="text"
                className="macro-calc-input"
                placeholder="Recipe name"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                required
              />
            </div>

            {/* Category */}
            <div className="macro-calc-field" ref={categoryRef} style={{ position: 'relative' }}>
              <label htmlFor="crm-category">Category</label>
              <input
                id="crm-category"
                type="text"
                className="macro-calc-input"
                placeholder="e.g. Chicken, Pasta, Dessert"
                value={form.category}
                onChange={(e) => { set('category', e.target.value); setShowCategoryList(true); }}
                onFocus={() => setShowCategoryList(true)}
                autoComplete="off"
              />
              {showCategoryList && categoryNames.length > 0 && (
                <ul className="crm-category-dropdown">
                  {categoryNames
                    .filter((n) => n.toLowerCase().includes(form.category.toLowerCase()))
                    .slice(0, 8)
                    .map((n) => (
                      <li
                        key={n}
                        className="crm-category-option"
                        onMouseDown={() => { set('category', n); setShowCategoryList(false); }}
                      >
                        {n}
                      </li>
                    ))}
                </ul>
              )}
            </div>

            {/* Servings + Area */}
            <div className="crm-row">
              <div className="macro-calc-field crm-field-half">
                <label htmlFor="crm-servings">Servings</label>
                <input
                  id="crm-servings"
                  type="number"
                  min="1" max="50"
                  className="macro-calc-input"
                  value={form.servings}
                  onChange={(e) => set('servings', Math.max(1, Number(e.target.value)))}
                />
              </div>
              <div className="macro-calc-field crm-field-half">
                <label htmlFor="crm-area">Cuisine</label>
                <input
                  id="crm-area"
                  type="text"
                  className="macro-calc-input"
                  placeholder="e.g. Italian"
                  value={form.area}
                  onChange={(e) => set('area', e.target.value)}
                />
              </div>
            </div>

            {/* Dietary tags */}
            <div className="macro-calc-field">
              <label>Dietary</label>
              <div className="cm-restrictions">
                {Object.entries(DIETARY_RESTRICTIONS).map(([key, r]) => (
                  <button
                    key={key}
                    type="button"
                    className={`cm-restriction-chip${form.tags.includes(key) ? ' active' : ''}`}
                    onClick={() => toggleTag(key)}
                  >
                    {r.icon} {r.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Published toggle */}
            <div className="crm-published-row">
              <label className="crm-toggle-label">
                <input
                  type="checkbox"
                  checked={form.published}
                  onChange={(e) => set('published', e.target.checked)}
                />
                <span>Public (share with community)</span>
              </label>
            </div>
          </div>

          {/* Right panel */}
          <div className="crm-right">
            <div className="macro-calc-field crm-ingredients-field">
              <label>Ingredients *</label>
              <div className="crm-ingredients-list">
                {form.ingredients.map((ing, i) => (
                  <div key={i} className="crm-ingredient-row">
                    <input
                      type="text"
                      className="macro-calc-input crm-ingredient-input"
                      placeholder={`e.g. 200g chicken breast`}
                      value={ing}
                      onChange={(e) => handleIngredientChange(i, e.target.value)}
                      onKeyDown={(e) => handleIngredientKeyDown(e, i)}
                    />
                    <button
                      type="button"
                      className="crm-ingredient-remove"
                      onClick={() => handleIngredientRemove(i)}
                      aria-label="Remove ingredient"
                      disabled={form.ingredients.length === 1}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="btn btn--ghost btn--sm crm-add-ingredient"
                onClick={() => setForm((f) => ({ ...f, ingredients: [...f.ingredients, ''] }))}
              >
                + Add ingredient
              </button>
            </div>

            <div className="macro-calc-field">
              <label htmlFor="crm-instructions">Instructions</label>
              <textarea
                id="crm-instructions"
                className="macro-calc-input crm-instructions"
                placeholder="Step-by-step instructions…"
                value={form.instructions}
                onChange={(e) => set('instructions', e.target.value)}
                rows={10}
              />
            </div>
          </div>
        </div>

        {error && <p className="crm-error">{error}</p>}

        <div className="crm-footer">
          <button type="button" className="btn btn--outline" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn btn--primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : mode === 'edit' ? 'Save changes' : 'Save recipe'}
          </button>
        </div>
      </div>
    </div>
  );
}
