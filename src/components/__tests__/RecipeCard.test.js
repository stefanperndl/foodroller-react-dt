import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { RecipeCard } from '../RecipeCard';

jest.mock('../../lib/firebase', () => ({ db: null, auth: null, googleProvider: null }));

describe('RecipeCard', () => {
  const mockRecipe = {
    id: '52772',
    name: 'Teriyaki Chicken Casserole',
    image: 'https://www.themealdb.com/images/media/meals/wvpsxx1468256321.jpg',
    category: 'Chicken',
  };

  it('renders recipe card with name and image', () => {
    render(<RecipeCard Food={mockRecipe} />);

    expect(screen.getByText('Teriyaki Chicken Casserole')).toBeInTheDocument();
    expect(screen.getByAltText('Teriyaki Chicken Casserole')).toBeInTheDocument();
    expect(screen.getByAltText('Teriyaki Chicken Casserole')).toHaveAttribute(
      'src',
      mockRecipe.image
    );
  });

  it('displays category badge', () => {
    render(<RecipeCard Food={mockRecipe} />);

    expect(screen.getByText('Chicken')).toBeInTheDocument();
  });

  it('calls onClick handler when clicked', () => {
    const handleClick = jest.fn();
    render(<RecipeCard Food={mockRecipe} onClick={handleClick} />);

    fireEvent.click(screen.getByText('Teriyaki Chicken Casserole'));

    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(handleClick).toHaveBeenCalledWith(mockRecipe);
  });

  it('does not apply pointer cursor when onClick is not provided', () => {
    render(<RecipeCard Food={mockRecipe} />);

    expect(screen.getByTestId('recipe-card')).not.toHaveStyle('cursor: pointer');
  });

  it('applies pointer cursor when onClick is provided', () => {
    const handleClick = jest.fn();
    render(<RecipeCard Food={mockRecipe} onClick={handleClick} />);

    expect(screen.getByTestId('recipe-card')).toHaveStyle('cursor: pointer');
  });

  it('renders without crashing when recipe has minimal data', () => {
    const minimalRecipe = {
      id: '1',
      name: 'Test Recipe',
    };

    render(<RecipeCard Food={minimalRecipe} />);
    expect(screen.getByText('Test Recipe')).toBeInTheDocument();
  });
});
