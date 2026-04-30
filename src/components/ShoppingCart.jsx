'use client';
import { useState } from 'react';
import { X, Copy, FileDown, Printer } from 'lucide-react';
import { mergeIngredients } from '../utils/utils';
import { copyToClipboard, exportCSV, printList } from '../utils/exportUtils';

export function ShoppingCart({ ingredientsByRecipe, onClose }) {
  const [copied, setCopied] = useState(false);
  const mergedIngredients = mergeIngredients(ingredientsByRecipe);

  async function handleCopy() {
    await copyToClipboard(mergedIngredients);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="cart-overlay" onClick={onClose}>
      <div className="cart-panel" onClick={(e) => e.stopPropagation()}>

        <div className="cart-panel__header">
          <h2>Shopping List</h2>
          <button className="btn btn--ghost btn--icon" onClick={onClose} aria-label="Close">
            <X size={18} strokeWidth={1.75} />
          </button>
        </div>

        <div className="cart-panel__actions">
          <button onClick={handleCopy} className="btn btn--outline btn--sm">
            <Copy size={13} strokeWidth={1.75} />
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button onClick={() => exportCSV(mergedIngredients)} className="btn btn--outline btn--sm">
            <FileDown size={13} strokeWidth={1.75} />
            CSV
          </button>
          <button onClick={printList} className="btn btn--outline btn--sm">
            <Printer size={13} strokeWidth={1.75} />
            Print
          </button>
        </div>

        <div className="cart-panel__body">
          {mergedIngredients.length === 0 ? (
            <div className="cart-empty">
              <span className="cart-empty-icon">🛒</span>
              <p>Add meals to your plan to build a shopping list.</p>
            </div>
          ) : (
            <div className="cart-merged-list">
              <p className="cart-section-label">All ingredients</p>
              <ul>
                {mergedIngredients.map((item, idx) => (
                  <li key={idx} className="cart-ing">
                    <span className="cart-ing-measure">
                      {item.qty % 1 === 0 ? item.qty : item.qty.toFixed(1)}
                      {item.unit ? ` ${item.unit}` : ''}
                    </span>
                    <span className="cart-ing-name">{item.name}</span>
                    {item.meals.length > 0 && (
                      <span className="cart-ing-source">{item.meals.join(', ')}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {Object.entries(ingredientsByRecipe).length > 0 && (
            <div className="cart-by-recipe">
              <p className="cart-section-label">By recipe</p>
              {Object.entries(ingredientsByRecipe).map(([key, recipe]) => (
                <div key={key} className="cart-recipe">
                  <div className="cart-recipe__head">
                    <span className="cart-recipe__name">{recipe.name || 'Recipe'}</span>
                  </div>
                  <ul className="cart-recipe__ings">
                    {recipe.ingredients?.map((item, idx) => (
                      <li key={idx} className="cart-ing cart-ing--plain">{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default ShoppingCart;
