import { useState } from 'react';
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
          <button className="btn btn--ghost btn--icon" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="cart-panel__body">
          <div className="shopping-export-actions">
            <button onClick={handleCopy} className="export-btn btn btn--outline btn--sm">
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button onClick={() => exportCSV(mergedIngredients)} className="export-btn btn btn--outline btn--sm">
              CSV
            </button>
            <button onClick={printList} className="export-btn btn btn--outline btn--sm">
              Print / PDF
            </button>
          </div>

          <div className="shopping-merged-summary">
            <h3>Total Ingredients</h3>
            <ul>
              {mergedIngredients.map((item, idx) => (
                <li key={idx}>
                  {item.qty % 1 === 0 ? item.qty : item.qty.toFixed(2)}
                  {item.unit ? ` ${item.unit}` : ''} {item.name}
                  {item.meals.length > 0 && (
                    <span> ({item.meals.join(', ')})</span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {Object.entries(ingredientsByRecipe).map(([date, recipe]) => (
            <div key={date} className="cart-recipe">
              <h3 className="cart-recipe__head">
                {recipe.name || 'Recipe'}{' '}
                <span>({date})</span>
              </h3>
              <ul className="cart-recipe__ings">
                {recipe.ingredients?.map((item, idx) => (
                  <li key={idx} className="cart-ing">{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ShoppingCart;
