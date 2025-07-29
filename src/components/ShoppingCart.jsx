import '../App.css';

export function ShoppingCart({ ingredients, onClose }) {
  return (
    <div className="shopping-cart-view">
      <h2>Shopping List</h2>
      <button className="close-cart" onClick={onClose}>Close</button>
      <table className="shopping-list-table">
        <thead>
          <tr>
            <th>Amount</th>
            <th>Ingredient</th>
          </tr>
        </thead>
        <tbody>
          {ingredients.map((item, idx) => (
            <tr key={idx}>
              <td>{item.amount ? `${item.amount}${item.unit}` : ''}</td>
              <td>{item.name}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}