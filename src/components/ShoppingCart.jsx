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
    <div className="shopping-cart-view">
      <div className="shopping-cart-header">
        <h2>Shopping List</h2>
        <button className="close-cart" onClick={onClose}>Close</button>
      </div>

      <div className="shopping-export-actions">
        <button onClick={handleCopy} className="export-btn">
          {copied ? 'Copied!' : 'Copy'}
        </button>
        <button onClick={() => exportCSV(mergedIngredients)} className="export-btn">
          CSV
        </button>
        <button onClick={printList} className="export-btn">
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
        <div key={date} className="shopping-recipe-cluster">
          <h3>
            {recipe.name || 'Recipe'}{' '}
            <span>({date})</span>
          </h3>
          <ul>
            {recipe.ingredients?.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export default ShoppingCart;
