import { render, screen, fireEvent } from '@testing-library/react';
import { RecipeCard } from '../components/RecipeCard';

const meal = { name: 'Chicken Tikka', image: 'chicken.jpg', category: 'Chicken' };

describe('RecipeCard', () => {
  it('renders name and category', () => {
    render(<RecipeCard Food={meal} />);
    expect(screen.getByText('Chicken Tikka')).toBeInTheDocument();
    expect(screen.getByText('Chicken')).toBeInTheDocument();
  });

  it('renders image with correct src and alt', () => {
    render(<RecipeCard Food={meal} />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'chicken.jpg');
    expect(img).toHaveAttribute('alt', 'Chicken Tikka');
  });

  it('calls onClick with the meal object', () => {
    const onClick = jest.fn();
    render(<RecipeCard Food={meal} onClick={onClick} />);
    fireEvent.click(screen.getByText('Chicken Tikka'));
    expect(onClick).toHaveBeenCalledWith(meal);
  });

  it('does not crash without onClick', () => {
    render(<RecipeCard Food={meal} />);
  });

  it('returns null when Food is missing', () => {
    const { container } = render(<RecipeCard />);
    expect(container).toBeEmptyDOMElement();
  });

  it('omits category paragraph when category is absent', () => {
    render(<RecipeCard Food={{ name: 'Mystery Dish', image: 'img.jpg' }} />);
    expect(screen.queryByRole('paragraph')).toBeNull();
  });
});
