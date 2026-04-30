import { render, screen, fireEvent } from '@testing-library/react';
import { FoodList } from '../components/FoodList';

jest.mock('../lib/firebase', () => ({ db: null, auth: null, googleProvider: null }));
jest.mock('../api/nutrition', () => ({ getNutritionFromCache: jest.fn(() => null) }));

jest.mock('../components/RecipeDetailModal', () => ({ meal, onClose }) => (
  <div data-testid="modal">
    <span>{meal.name}</span>
    <button onClick={onClose}>Close</button>
  </div>
));

const SLOTS = [
  { id: 'breakfast', label: 'Breakfast', order: 0 },
  { id: 'dinner',    label: 'Dinner',    order: 1 },
];

const makeMeal = (overrides = {}) => ({
  id: 'meal-1',
  name: 'Pasta',
  image: 'pasta.jpg',
  ingredients: ['pasta', 'sauce'],
  ...overrides,
});

const defaultProps = {
  startDate: '2026-05-01',
  endDate: '2026-05-01',
  mealplan: { '2026-05-01': { dinner: makeMeal() } },
  slots: SLOTS,
  getDaySlots: () => SLOTS,
  rerollingKey: null,
  onReroll: jest.fn(),
  onRemove: jest.fn(),
  onAddSlotToDay: jest.fn(),
  onRemoveSlotFromDay: jest.fn(),
};

beforeEach(() => jest.clearAllMocks());

describe('FoodList', () => {
  it('renders a day card with a formatted date header', () => {
    render(<FoodList {...defaultProps} />);
    expect(screen.getByText(/friday/i)).toBeInTheDocument();
    expect(screen.getByText(/may/i)).toBeInTheDocument();
  });

  it('renders the meal name for a filled slot', () => {
    render(<FoodList {...defaultProps} />);
    expect(screen.getByText('Pasta')).toBeInTheDocument();
  });

  it('shows "No meal planned" for an empty slot', () => {
    const props = { ...defaultProps, mealplan: {} };
    render(<FoodList {...props} />);
    expect(screen.getAllByText(/no meal planned/i).length).toBeGreaterThan(0);
  });

  it('shows "Rolling…" for the rerolling slot', () => {
    const props = { ...defaultProps, rerollingKey: '2026-05-01-dinner' };
    render(<FoodList {...props} />);
    expect(screen.getByText(/rolling/i)).toBeInTheDocument();
  });

  it('calls onReroll with date and slotId when ↺ is clicked on a filled slot', () => {
    const onReroll = jest.fn();
    render(<FoodList {...defaultProps} onReroll={onReroll} />);
    const rerollBtns = screen.getAllByTitle(/re-roll/i);
    fireEvent.click(rerollBtns[0]);
    expect(onReroll).toHaveBeenCalledWith('2026-05-01', expect.any(String));
  });

  it('calls onRemove with date and slotId when × is clicked on a meal', () => {
    const onRemove = jest.fn();
    render(<FoodList {...defaultProps} onRemove={onRemove} />);
    fireEvent.click(screen.getByTitle(/remove meal/i));
    expect(onRemove).toHaveBeenCalledWith('2026-05-01', 'dinner');
  });

  it('calls onRemoveSlotFromDay when the − button is clicked', () => {
    const onRemoveSlotFromDay = jest.fn();
    render(<FoodList {...defaultProps} onRemoveSlotFromDay={onRemoveSlotFromDay} />);
    const removeBtns = screen.getAllByTitle(/remove.*from this day/i);
    fireEvent.click(removeBtns[0]);
    expect(onRemoveSlotFromDay).toHaveBeenCalledWith('2026-05-01', expect.any(String));
  });

  it('shows add-slot dropdown with available slots when + is clicked', () => {
    const props = { ...defaultProps, mealplan: {}, getDaySlots: () => [] };
    render(<FoodList {...props} />);
    fireEvent.click(screen.getByText('+ Add slot'));
    expect(screen.getByText('Breakfast')).toBeInTheDocument();
    expect(screen.getByText('Dinner')).toBeInTheDocument();
  });

  it('calls onAddSlotToDay and closes dropdown when a slot is chosen', () => {
    const onAddSlotToDay = jest.fn();
    const props = { ...defaultProps, mealplan: {}, getDaySlots: () => [], onAddSlotToDay };
    render(<FoodList {...props} />);
    fireEvent.click(screen.getByText('+ Add slot'));
    fireEvent.click(screen.getByText('Breakfast'));
    expect(onAddSlotToDay).toHaveBeenCalledWith('2026-05-01', SLOTS[0]);
    expect(screen.queryByText('Dinner')).not.toBeInTheDocument();
  });

  it('shows "All default slots added" when no slots are available to add', () => {
    render(<FoodList {...defaultProps} />);
    fireEvent.click(screen.getByText('+ Add slot'));
    expect(screen.getByText(/all default slots added/i)).toBeInTheDocument();
  });

  it('opens detail modal when meal name is clicked', () => {
    render(<FoodList {...defaultProps} />);
    fireEvent.click(screen.getByText('Pasta'));
    expect(screen.getByTestId('modal')).toBeInTheDocument();
  });

  it('closes modal when the modal close button is clicked', () => {
    render(<FoodList {...defaultProps} />);
    fireEvent.click(screen.getByText('Pasta'));
    fireEvent.click(screen.getByText('Close'));
    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
  });
});
