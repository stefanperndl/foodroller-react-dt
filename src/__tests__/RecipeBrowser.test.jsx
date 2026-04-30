import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RecipeBrowser from '../components/RecipeBrowser';
import { fetchMealsByCategory } from '../api/recipes';

jest.mock('../api/recipes', () => ({ fetchMealsByCategory: jest.fn() }));
jest.mock('../lib/firebase', () => ({ db: null, auth: null, googleProvider: null }));
jest.mock('../api/nutrition', () => ({ getNutritionFromCache: jest.fn(() => null) }));
jest.mock('../components/RecipeDetailModal', () => ({ meal, onClose, onAddToDate }) => (
  <div data-testid="modal">
    <span>{meal.name}</span>
    <button onClick={onClose}>Close</button>
    {onAddToDate && <button onClick={() => onAddToDate(meal)}>Add to Date</button>}
  </div>
));

const meals = [
  { id: '1', name: 'Beef Stew', image: 'beef.jpg', category: 'Beef' },
  { id: '2', name: 'Greek Salad', image: 'salad.jpg', category: 'Vegetarian' },
];

const defaultProps = {
  categories: [{ strCategory: 'Beef' }, { strCategory: 'Vegetarian' }],
  selectedCategories: ['Beef'],
  selectedRestrictions: [],
  onAddToDate: jest.fn(),
};

beforeEach(() => jest.clearAllMocks());

describe('RecipeBrowser', () => {
  it('shows loading state while fetching', () => {
    fetchMealsByCategory.mockReturnValue(new Promise(() => {}));
    render(<RecipeBrowser {...defaultProps} />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('renders meal cards after successful fetch', async () => {
    fetchMealsByCategory.mockResolvedValue([meals[0]]);
    render(<RecipeBrowser {...defaultProps} />);
    expect(await screen.findByText('Beef Stew')).toBeInTheDocument();
  });

  it('shows empty state when fetch returns no meals', async () => {
    fetchMealsByCategory.mockResolvedValue([]);
    render(<RecipeBrowser {...defaultProps} />);
    expect(await screen.findByText(/no recipes found/i)).toBeInTheDocument();
  });

  it('shows error state when fetch fails', async () => {
    fetchMealsByCategory.mockRejectedValue(new Error('fail'));
    render(<RecipeBrowser {...defaultProps} />);
    expect(await screen.findByText(/failed to load/i)).toBeInTheDocument();
  });

  it('calls onAddToDate when Add to Date button clicked', async () => {
    const onAddToDate = jest.fn();
    fetchMealsByCategory.mockResolvedValue([meals[0]]);
    render(<RecipeBrowser {...defaultProps} onAddToDate={onAddToDate} />);
    await screen.findByText('Beef Stew');
    fireEvent.click(screen.getByText('Add to Date'));
    expect(onAddToDate).toHaveBeenCalledWith(meals[0]);
  });

  it('filters meals that fail dietary restriction validation', async () => {
    fetchMealsByCategory
      .mockResolvedValueOnce([meals[0]])
      .mockResolvedValueOnce([meals[1]]);
    render(
      <RecipeBrowser
        {...defaultProps}
        selectedCategories={['Beef', 'Vegetarian']}
        selectedRestrictions={['vegetarian']}
      />
    );
    await waitFor(() => expect(screen.queryByText(/loading/i)).not.toBeInTheDocument());
    expect(screen.queryByText('Beef Stew')).not.toBeInTheDocument();
    expect(screen.getByText('Greek Salad')).toBeInTheDocument();
  });

  it('opens modal when recipe card is clicked', async () => {
    fetchMealsByCategory.mockResolvedValue([meals[0]]);
    render(<RecipeBrowser {...defaultProps} />);
    fireEvent.click(await screen.findByText('Beef Stew'));
    expect(screen.getByTestId('modal')).toBeInTheDocument();
  });

  it('closes modal on close button click', async () => {
    fetchMealsByCategory.mockResolvedValue([meals[0]]);
    render(<RecipeBrowser {...defaultProps} />);
    fireEvent.click(await screen.findByText('Beef Stew'));
    fireEvent.click(screen.getByText('Close'));
    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
  });
});
