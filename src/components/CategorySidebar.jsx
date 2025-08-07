import React from 'react';
export function CategorySidebar({ open, categories, selected, onToggle, onSelect }) {
  return (
    <div className={`category-sidebar${open ? ' open' : ''}`}>
      <div className="sidebar-toggle" onClick={onToggle}>
        <div className="burger-menu">
          <span />
          <span />
          <span />
        </div>
      </div>
      {open && (
        <div className="sidebar-content">
          <h3>Categories</h3>
          <ul>
            {categories.map(cat => (
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
      )}
    </div>
  );
}