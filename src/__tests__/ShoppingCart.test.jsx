import { render, screen, fireEvent } from '@testing-library/react';
import { ShoppingCart } from '../components/ShoppingCart';
import { mergeIngredients } from '../utils/utils';

jest.mock('../utils/exportUtils', () => ({
  copyToClipboard: jest.fn().mockResolvedValue(undefined),
  exportCSV: jest.fn(),
  printList: jest.fn(),
}));

const samplePlan = {
  '2026-05-01': { name: 'Pasta', ingredients: ['200g pasta', '1 egg'] },
};

describe('ShoppingCart component', () => {
  it('renders export buttons', () => {
    render(<ShoppingCart ingredientsByRecipe={samplePlan} onClose={() => {}} />);
    expect(screen.getByText('Copy')).toBeInTheDocument();
    expect(screen.getByText('CSV')).toBeInTheDocument();
    expect(screen.getByText('Print')).toBeInTheDocument();
  });

  it('renders recipe ingredients', () => {
    render(<ShoppingCart ingredientsByRecipe={samplePlan} onClose={() => {}} />);
    expect(screen.getByText('200g pasta')).toBeInTheDocument();
  });

  it('calls onClose when Close is clicked', () => {
    const onClose = jest.fn();
    render(<ShoppingCart ingredientsByRecipe={samplePlan} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('renders without crashing with empty plan', () => {
    render(<ShoppingCart ingredientsByRecipe={{}} onClose={() => {}} />);
    expect(screen.getByText('Shopping List')).toBeInTheDocument();
  });
});

describe('mergeIngredients', () => {
  it('merges identical ingredients and sums quantities', () => {
    const input = {
      d1: { name: 'Meal1', ingredients: ['1 egg', '2 egg'] },
      d2: { name: 'Meal2', ingredients: ['3 egg'] },
    };
    const result = mergeIngredients(input);
    const egg = result.find(i => i.name === 'egg');
    expect(egg.qty).toBe(6);
    expect(egg.unit).toBe('');
    expect(egg.meals).toContain('Meal1');
    expect(egg.meals).toContain('Meal2');
  });

  it('merges tbs as 100g or 100ml', () => {
    const input = {
      d1: { name: 'Meal1', ingredients: ['2 tbs sugar', '1 tbs milk'] },
      d2: { name: 'Meal2', ingredients: ['1 tbs sugar', '1 tbs water'] },
    };
    const result = mergeIngredients(input);
    const sugar = result.find(i => i.name === 'sugar');
    const milk = result.find(i => i.name === 'milk');
    const water = result.find(i => i.name === 'water');
    expect(sugar.qty).toBe(300);
    expect(sugar.unit).toBe('g');
    expect(milk.qty).toBe(100);
    expect(milk.unit).toBe('ml');
    expect(water.qty).toBe(100);
    expect(water.unit).toBe('ml');
  });

  it('merges with different units separately', () => {
    const input = {
      d1: { name: 'Meal1', ingredients: ['1 tbs sugar', '100 g sugar'] },
    };
    const result = mergeIngredients(input);
    const sugarG = result.find(i => i.name === 'sugar' && i.unit === 'g');
    expect(sugarG.qty).toBe(200);
  });

  it('lists all meal names for each ingredient', () => {
    const input = {
      d1: { name: 'Cake', ingredients: ['1 egg'] },
      d2: { name: 'Omelette', ingredients: ['2 egg'] },
    };
    const result = mergeIngredients(input);
    const egg = result.find(i => i.name === 'egg');
    expect(egg.meals).toContain('Cake');
    expect(egg.meals).toContain('Omelette');
  });
});
