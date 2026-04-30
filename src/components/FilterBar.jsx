import { useState, useRef, useEffect, useMemo } from 'react';
import { DIETARY_RESTRICTIONS, getCompatibleCategories } from '../utils/dietaryRestrictions';
import { useFilterContext } from '../context/FilterContext';

export function FilterBar() {
  const { categories, selectedCategories, selectedRestrictions, toggleCategory, toggleRestriction, clearCategories } = useFilterContext();
  const [catOpen, setCatOpen] = useState(false);
  const popoverRef = useRef(null);

  const compatibleCategories = useMemo(
    () => getCompatibleCategories(selectedRestrictions, categories),
    [categories, selectedRestrictions]
  );

  useEffect(() => {
    if (!catOpen) return;
    const handler = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) setCatOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [catOpen]);

  const selectedCount = selectedCategories.length;

  return (
    <div className="filter-bar-wrap">
      <div className="filter-bar">
        <span className="filter-bar__label">Filter</span>
        {Object.entries(DIETARY_RESTRICTIONS).map(([key, restriction]) => (
          <button
            key={key}
            className={`dietary-chip ${selectedRestrictions.includes(key) ? 'active' : ''}`}
            onClick={() => toggleRestriction(key)}
            title={restriction.name}
          >
            {restriction.icon} {restriction.name}
          </button>
        ))}
      </div>
      <div className="filter-bar__divider" />
      <div className="cat-popover-wrap" ref={popoverRef}>
        <button
          className={`cat-filter-btn ${selectedCount > 0 ? 'has-selection' : ''}`}
          onClick={() => setCatOpen((o) => !o)}
        >
          Categories
          {selectedCount > 0 ? (
            <span className="count-badge">{selectedCount}</span>
          ) : (
            <span>▾</span>
          )}
        </button>
        {catOpen && (
          <div className="cat-popover">
            <div className="cat-popover__header">
              <span>Categories</span>
              {selectedCount > 0 && (
                <button className="btn btn--ghost" style={{ fontSize: 11, padding: '2px 6px' }} onClick={clearCategories}>
                  Clear
                </button>
              )}
            </div>
            <div className="cat-popover__grid">
              {compatibleCategories.map((cat) => (
                <button
                  key={cat.strCategory}
                  className={`cat-chip ${selectedCategories.includes(cat.strCategory) ? 'selected' : ''}`}
                  onClick={() => toggleCategory(cat.strCategory)}
                >
                  {cat.strCategory}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
