import { render, screen, fireEvent } from '@testing-library/react';
import { FoodList } from '../components/FoodList';

// Prevent RecipeDetailModal from making real API calls
jest.mock('../components/RecipeDetailModal', () => ({ meal, onClose }) => (
  <div data-testid="modal">
    <span>{meal.name}</span>
    <button onClick={onClose}>Close</button>
  </div>
));

const makeMeal = (overrides = {}) => ({
  date: '2026-05-01',
  name: 'Pasta',
  image: 'pasta.jpg',
  category: 'Italian',
  saved: false,
  ...overrides,
});

const defaultProps = {
  food: [makeMeal()],
  loading: false,
  onSave: jest.fn(),
  onReroll: jest.fn(),
};

beforeEach(() => jest.clearAllMocks());

describe('FoodList', () => {
  it('shows loading text when loading', () => {
    render(<FoodList {...defaultProps} loading={true} />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('renders nothing when food list is empty', () => {
    const { container } = render(<FoodList {...defaultProps} food={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders a tile with the date and recipe name', () => {
    render(<FoodList {...defaultProps} />);
    expect(screen.getByText('2026-05-01')).toBeInTheDocument();
    expect(screen.getByText('Pasta')).toBeInTheDocument();
  });

  it('shows Save button for unsaved meal', () => {
    render(<FoodList {...defaultProps} />);
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
  });

  it('calls onSave with date and recipe when Save clicked', () => {
    const onSave = jest.fn();
    const meal = makeMeal();
    render(<FoodList {...defaultProps} food={[meal]} onSave={onSave} />);
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    expect(onSave).toHaveBeenCalledWith('2026-05-01', meal);
  });

  it('shows Re-roll button and calls onReroll when meal is saved', () => {
    const onReroll = jest.fn();
    const meal = makeMeal({ saved: '2026-05-01' });
    render(<FoodList {...defaultProps} food={[meal]} onReroll={onReroll} />);
    fireEvent.click(screen.getByRole('button', { name: /re-roll/i }));
    expect(onReroll).toHaveBeenCalledWith('2026-05-01');
  });

  it('opens modal when recipe card is clicked', () => {
    render(<FoodList {...defaultProps} />);
    fireEvent.click(screen.getByText('Pasta'));
    expect(screen.getByTestId('modal')).toBeInTheDocument();
  });

  it('closes modal when modal close button clicked', () => {
    render(<FoodList {...defaultProps} />);
    fireEvent.click(screen.getByText('Pasta'));
    fireEvent.click(screen.getByText('Close'));
    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
  });
});
