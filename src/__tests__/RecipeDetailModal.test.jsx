import { render, screen, fireEvent } from '@testing-library/react';
import RecipeDetailModal from '../components/RecipeDetailModal';
import { fetchMealById } from '../api/recipes';

jest.mock('../api/recipes', () => ({ fetchMealById: jest.fn() }));

const fullMeal = {
  id: '1',
  name: 'Chicken Tikka',
  image: 'tikka.jpg',
  category: 'Chicken',
  area: 'Indian',
  ingredients: ['500g chicken', '2 tbs yogurt'],
  instructions: 'Mix and cook.',
  tags: [],
};

beforeEach(() => jest.clearAllMocks());

describe('RecipeDetailModal', () => {
  it('uses meal directly when it already has ingredients and instructions', async () => {
    render(<RecipeDetailModal meal={fullMeal} onClose={jest.fn()} />);
    expect(await screen.findByText('Chicken Tikka')).toBeInTheDocument();
    expect(fetchMealById).not.toHaveBeenCalled();
  });

  it('shows loading state then fetches full details for preview meal', async () => {
    fetchMealById.mockResolvedValue(fullMeal);
    render(<RecipeDetailModal meal={{ id: '1', name: 'Chicken Tikka' }} onClose={jest.fn()} />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
    expect(await screen.findByText('Chicken Tikka')).toBeInTheDocument();
    expect(fetchMealById).toHaveBeenCalledWith('1');
  });

  it('shows error message when fetch fails', async () => {
    fetchMealById.mockRejectedValue(new Error('network error'));
    render(<RecipeDetailModal meal={{ id: '1' }} onClose={jest.fn()} />);
    expect(await screen.findByText(/failed to load/i)).toBeInTheDocument();
  });

  it('calls onClose when backdrop is clicked', async () => {
    const onClose = jest.fn();
    render(<RecipeDetailModal meal={fullMeal} onClose={onClose} />);
    await screen.findByText('Chicken Tikka');
    fireEvent.click(screen.getByTestId('modal-overlay'));
    expect(onClose).toHaveBeenCalled();
  });

  it('does not call onClose when modal content is clicked', async () => {
    const onClose = jest.fn();
    render(<RecipeDetailModal meal={fullMeal} onClose={onClose} />);
    await screen.findByText('Chicken Tikka');
    fireEvent.click(screen.getByTestId('modal-content'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('renders ingredients list', async () => {
    render(<RecipeDetailModal meal={fullMeal} onClose={jest.fn()} />);
    expect(await screen.findByText('500g chicken')).toBeInTheDocument();
  });

  it('shows Add to Date button only when onAddToDate is provided', async () => {
    const { rerender } = render(<RecipeDetailModal meal={fullMeal} onClose={jest.fn()} />);
    await screen.findByText('Chicken Tikka');
    expect(screen.queryByText(/add to plan/i)).not.toBeInTheDocument();

    rerender(<RecipeDetailModal meal={fullMeal} onClose={jest.fn()} onAddToDate={jest.fn()} />);
    expect(screen.getByText(/add to plan/i)).toBeInTheDocument();
  });

  it('calls onAddToDate with the full recipe', async () => {
    const onAddToDate = jest.fn();
    render(<RecipeDetailModal meal={fullMeal} onClose={jest.fn()} onAddToDate={onAddToDate} />);
    fireEvent.click(await screen.findByText(/add to plan/i));
    expect(onAddToDate).toHaveBeenCalledWith(fullMeal);
  });
});
