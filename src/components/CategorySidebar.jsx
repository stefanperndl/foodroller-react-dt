import React from 'react';
import { DIETARY_RESTRICTIONS, getCompatibleCategories } from '../utils/dietaryRestrictions';

export function CategorySidebar({ open, categories, selected, restrictions, onToggle, onSelect, onRestrictionToggle }) {
  // Filter categories based on active dietary restrictions
  const compatibleCategories = getCompatibleCategories(restrictions, categories);
  
  return (
    <div className="category-sidebar">
      <div className="sidebar-content">
        {/* Dietary Restrictions Section */}
        <div className="dietary-section">
          <h3>Dietary</h3>
          <div className="dietary-presets">
            {Object.entries(DIETARY_RESTRICTIONS).map(([key, restriction]) => (
              <button
                key={key}
                className={`dietary-preset-btn ${restrictions.includes(key) ? 'active' : ''}`}
                onClick={() => onRestrictionToggle(key)}
                title={restriction.name}
              >
                <span className="dietary-icon">{restriction.icon}</span>
                <span className="dietary-name">{restriction.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Categories Section */}
        <h3>Categories</h3>
        <ul>
          {compatibleCategories.map(cat => (
            <li key={cat.idCategory}>
              <label>
                <input
                  type="checkbox"
                  checked={selected.includes(cat.strCategory)}
                  onChange={() => onSelect(cat.strCategory)}
                />
                {cat.strCategory}
              </label>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}