import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import RecipeDetailModal from '../RecipeDetailModal';
import { fetchMealById } from '../../api/recipes';

jest.mock('../../api/recipes', () => ({ fetchMealById: jest.fn() }));
jest.mock('../../lib/firebase', () => ({ db: null, auth: null, googleProvider: null }));

describe('RecipeDetailModal', () => {
  const mockMeal = {
    id: '52772',
    name: 'Teriyaki Chicken Casserole',
    image: 'https://www.themealdb.com/images/media/meals/wvpsxx1468256321.jpg',
    category: 'Chicken',
    area: 'Japanese',
    tags: ['Meat', 'Casserole'],
    ingredients: ['1 lb chicken', '3 tbsp soy sauce', '1/2 cup water'],
    instructions: 'Preheat oven to 350°. Cook chicken. Mix ingredients. Bake for 30 minutes.',
  };

  const mockOnClose = jest.fn();
  const mockOnAddToDate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders modal with meal details', () => {
    render(
      <RecipeDetailModal
        meal={mockMeal}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Teriyaki Chicken Casserole')).toBeInTheDocument();
    expect(screen.getByText('Japanese')).toBeInTheDocument();
    expect(screen.getByText(/soy sauce/i)).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(
      <RecipeDetailModal
        meal={mockMeal}
        onClose={mockOnClose}
      />
    );

    const closeButton = screen.getByLabelText('Close');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when clicking outside modal', () => {
    render(
      <RecipeDetailModal
        meal={mockMeal}
        onClose={mockOnClose}
      />
    );

    fireEvent.click(screen.getByTestId('modal-overlay'));

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('does not close when clicking inside modal content', () => {
    render(
      <RecipeDetailModal
        meal={mockMeal}
        onClose={mockOnClose}
      />
    );

    fireEvent.click(screen.getByTestId('modal-content'));

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('shows Add to plan button when onAddToDate is provided', () => {
    render(
      <RecipeDetailModal
        meal={mockMeal}
        onClose={mockOnClose}
        onAddToDate={mockOnAddToDate}
      />
    );

    expect(screen.getByText(/add to plan/i)).toBeInTheDocument();
  });

  it('hides Add to plan button when onAddToDate is not provided', () => {
    render(
      <RecipeDetailModal
        meal={mockMeal}
        onClose={mockOnClose}
      />
    );

    expect(screen.queryByText(/add to plan/i)).not.toBeInTheDocument();
  });

  it('calls onAddToDate when Add to plan button is clicked', () => {
    render(
      <RecipeDetailModal
        meal={mockMeal}
        onClose={mockOnClose}
        onAddToDate={mockOnAddToDate}
      />
    );

    const addButton = screen.getByText(/add to plan/i);
    fireEvent.click(addButton);

    expect(mockOnAddToDate).toHaveBeenCalledTimes(1);
  });

  it('fetches full meal details when meal lacks ingredients', async () => {
    const incompleteMeal = {
      id: '52772',
      name: 'Teriyaki Chicken Casserole',
      image: 'test.jpg',
    };

    const fullMeal = { ...mockMeal };
    fetchMealById.mockResolvedValue(fullMeal);

    render(
      <RecipeDetailModal
        meal={incompleteMeal}
        onClose={mockOnClose}
      />
    );

    await waitFor(() => {
      expect(fetchMealById).toHaveBeenCalledWith('52772');
    });
    expect(screen.getByText('Teriyaki Chicken Casserole')).toBeInTheDocument();
  });

  it('shows loading state while fetching details', () => {
    render(
      <RecipeDetailModal
        meal={{ id: '123', name: 'Test', image: 'test.jpg' }}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('displays dietary badges when applicable', () => {
    const vegetarianMeal = {
      ...mockMeal,
      category: 'Vegetarian',
      ingredients: ['2 cups tomato', '1 onion', '3 cloves garlic'],
    };

    render(
      <RecipeDetailModal
        meal={vegetarianMeal}
        onClose={mockOnClose}
      />
    );

    // Should show vegetarian badge
    expect(screen.getByText(/🌱/)).toBeInTheDocument();
  });

  it('displays category and area tags', () => {
    render(
      <RecipeDetailModal
        meal={mockMeal}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Chicken')).toBeInTheDocument();
    expect(screen.getByText('Japanese')).toBeInTheDocument();
  });

  it('renders instructions text', () => {
    render(
      <RecipeDetailModal
        meal={mockMeal}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText(/Preheat oven/i)).toBeInTheDocument();
  });

  it('handles error state when fetching fails', async () => {
    const incompleteMeal = {
      id: '52772',
      name: 'Test Recipe',
      image: 'test.jpg',
    };

    fetchMealById.mockRejectedValue(new Error('API Error'));

    render(
      <RecipeDetailModal
        meal={incompleteMeal}
        onClose={mockOnClose}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
    });
  });
});
