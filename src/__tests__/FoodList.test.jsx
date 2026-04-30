import { render, screen, fireEvent } from '@testing-library/react';
import { FoodList } from '../components/FoodList';
import { useFilterContext } from '../context/FilterContext';
import { useMacroContext } from '../context/MacroContext';
import { useMealPlanContext } from '../context/MealPlanContext';

jest.mock('../lib/firebase', () => ({ db: null, auth: null, googleProvider: null }));
jest.mock('../api/nutrition', () => ({ getNutritionFromCache: jest.fn(() => null) }));

jest.mock('../components/RecipeDetailModal', () => ({ meal, onClose }) => (
  <div data-testid="modal">
    <span>{meal.name}</span>
    <button onClick={onClose}>Close</button>
  </div>
));

jest.mock('../context/FilterContext', () => ({
  useFilterContext: jest.fn(),
}));
jest.mock('../context/MacroContext', () => ({
  useMacroContext: jest.fn(),
}));
jest.mock('../context/MealPlanContext', () => ({
  useMealPlanContext: jest.fn(),
}));

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

const mockReroll = jest.fn();
const mockRemove = jest.fn();
const mockAddSlot = jest.fn();
const mockRemoveSlot = jest.fn();
const mockSlotFilterChange = jest.fn();

function setDefaultMocks({ mealplan = { '2026-05-01': { dinner: makeMeal() } }, getDaySlots = () => SLOTS, rerollingKey = null } = {}) {
  useFilterContext.mockReturnValue({ categories: [] });
  useMacroContext.mockReturnValue({ effectiveMacroProfile: null });
  useMealPlanContext.mockReturnValue({
    mealplan,
    slots: SLOTS,
    getDaySlots,
    rerollingKey,
    slotFilters: {},
    nutritionMap: {},
    handleReroll: mockReroll,
    handleRemoveMeal: mockRemove,
    handleAddSlotToDay: mockAddSlot,
    handleRemoveSlotFromDay: mockRemoveSlot,
    handleSlotFilterChange: mockSlotFilterChange,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  setDefaultMocks();
});

describe('FoodList', () => {
  it('renders a day card with a formatted date header', () => {
    render(<FoodList startDate="2026-05-01" endDate="2026-05-01" />);
    expect(screen.getByText(/friday/i)).toBeInTheDocument();
    expect(screen.getByText(/may/i)).toBeInTheDocument();
  });

  it('renders the meal name for a filled slot', () => {
    render(<FoodList startDate="2026-05-01" endDate="2026-05-01" />);
    expect(screen.getByText('Pasta')).toBeInTheDocument();
  });

  it('shows "No meal planned" for an empty slot', () => {
    setDefaultMocks({ mealplan: {} });
    render(<FoodList startDate="2026-05-01" endDate="2026-05-01" />);
    expect(screen.getAllByText(/no meal planned/i).length).toBeGreaterThan(0);
  });

  it('shows "Rolling…" for the rerolling slot', () => {
    setDefaultMocks({ rerollingKey: '2026-05-01-dinner' });
    render(<FoodList startDate="2026-05-01" endDate="2026-05-01" />);
    expect(screen.getByText(/rolling/i)).toBeInTheDocument();
  });

  it('calls handleReroll with date and slotId when ↺ is clicked on a filled slot', () => {
    render(<FoodList startDate="2026-05-01" endDate="2026-05-01" />);
    const rerollBtns = screen.getAllByTitle(/re-roll/i);
    fireEvent.click(rerollBtns[0]);
    expect(mockReroll).toHaveBeenCalledWith('2026-05-01', expect.any(String));
  });

  it('calls handleRemoveMeal with date and slotId when × is clicked on a meal', () => {
    render(<FoodList startDate="2026-05-01" endDate="2026-05-01" />);
    fireEvent.click(screen.getByTitle(/remove meal/i));
    expect(mockRemove).toHaveBeenCalledWith('2026-05-01', 'dinner');
  });

  it('calls handleRemoveSlotFromDay when the − button is clicked', () => {
    render(<FoodList startDate="2026-05-01" endDate="2026-05-01" />);
    const removeBtns = screen.getAllByTitle(/remove.*from this day/i);
    fireEvent.click(removeBtns[0]);
    expect(mockRemoveSlot).toHaveBeenCalledWith('2026-05-01', expect.any(String));
  });

  it('shows add-slot dropdown with available slots when + is clicked', () => {
    setDefaultMocks({ mealplan: {}, getDaySlots: () => [] });
    render(<FoodList startDate="2026-05-01" endDate="2026-05-01" />);
    fireEvent.click(screen.getByText('+ Add slot'));
    expect(screen.getByText('Breakfast')).toBeInTheDocument();
    expect(screen.getByText('Dinner')).toBeInTheDocument();
  });

  it('calls handleAddSlotToDay and closes dropdown when a slot is chosen', () => {
    setDefaultMocks({ mealplan: {}, getDaySlots: () => [] });
    render(<FoodList startDate="2026-05-01" endDate="2026-05-01" />);
    fireEvent.click(screen.getByText('+ Add slot'));
    fireEvent.click(screen.getByText('Breakfast'));
    expect(mockAddSlot).toHaveBeenCalledWith('2026-05-01', SLOTS[0]);
    expect(screen.queryByText('Dinner')).not.toBeInTheDocument();
  });

  it('shows "All default slots added" when no slots are available to add', () => {
    render(<FoodList startDate="2026-05-01" endDate="2026-05-01" />);
    fireEvent.click(screen.getByText('+ Add slot'));
    expect(screen.getByText(/all default slots added/i)).toBeInTheDocument();
  });

  it('opens detail modal when meal name is clicked', () => {
    render(<FoodList startDate="2026-05-01" endDate="2026-05-01" />);
    fireEvent.click(screen.getByText('Pasta'));
    expect(screen.getByTestId('modal')).toBeInTheDocument();
  });

  it('closes modal when the modal close button is clicked', () => {
    render(<FoodList startDate="2026-05-01" endDate="2026-05-01" />);
    fireEvent.click(screen.getByText('Pasta'));
    fireEvent.click(screen.getByText('Close'));
    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
  });
});
