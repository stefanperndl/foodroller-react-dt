function formatText(mergedIngredients) {
  const lines = mergedIngredients.map(item => {
    const qty = item.qty % 1 === 0 ? item.qty : item.qty.toFixed(2);
    const unit = item.unit ? ` ${item.unit}` : '';
    const meals = item.meals.length > 0 ? ` (${item.meals.join(', ')})` : '';
    return `${qty}${unit} ${item.name}${meals}`;
  });
  return `Shopping List\n${'='.repeat(30)}\n${lines.join('\n')}`;
}

export async function copyToClipboard(mergedIngredients) {
  await navigator.clipboard.writeText(formatText(mergedIngredients));
}

export function exportCSV(mergedIngredients) {
  const header = 'Ingredient,Quantity,Unit,Used In';
  const rows = mergedIngredients.map(item => {
    const qty = item.qty % 1 === 0 ? item.qty : item.qty.toFixed(2);
    const meals = item.meals.join(' | ');
    return `"${item.name}","${qty}","${item.unit || ''}","${meals}"`;
  });
  const csv = [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'shopping-list.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export function printList() {
  window.print();
}
