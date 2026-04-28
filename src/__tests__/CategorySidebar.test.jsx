import { render, screen, fireEvent } from '@testing-library/react';
import { CategorySidebar } from '../components/CategorySidebar';

const categories = [
  { idCategory: '1', strCategory: 'Beef' },
  { idCategory: '2', strCategory: 'Vegetarian' },
  { idCategory: '3', strCategory: 'Chicken' },
];

const defaultProps = {
  open: true,
  categories,
  selected: [],
  restrictions: [],
  onToggle: jest.fn(),
  onSelect: jest.fn(),
  onRestrictionToggle: jest.fn(),
};

beforeEach(() => jest.clearAllMocks());

describe('CategorySidebar', () => {
  it('renders all categories when no restrictions active', () => {
    render(<CategorySidebar {...defaultProps} />);
    expect(screen.getByLabelText('Beef')).toBeInTheDocument();
    expect(screen.getByLabelText('Vegetarian')).toBeInTheDocument();
    expect(screen.getByLabelText('Chicken')).toBeInTheDocument();
  });

  it('hides incompatible categories when restriction is active', () => {
    render(<CategorySidebar {...defaultProps} restrictions={['vegetarian']} />);
    expect(screen.queryByLabelText('Beef')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Chicken')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Vegetarian')).toBeInTheDocument();
  });

  it('renders dietary preset buttons', () => {
    render(<CategorySidebar {...defaultProps} />);
    expect(screen.getByTitle('Vegetarian')).toBeInTheDocument();
    expect(screen.getByTitle('Vegan')).toBeInTheDocument();
    expect(screen.getByTitle('Pescatarian')).toBeInTheDocument();
  });

  it('marks active restriction button', () => {
    render(<CategorySidebar {...defaultProps} restrictions={['vegetarian']} />);
    expect(screen.getByTitle('Vegetarian').className).toContain('active');
    expect(screen.getByTitle('Vegan').className).not.toContain('active');
  });

  it('calls onRestrictionToggle with the restriction key', () => {
    const onRestrictionToggle = jest.fn();
    render(<CategorySidebar {...defaultProps} onRestrictionToggle={onRestrictionToggle} />);
    fireEvent.click(screen.getByTitle('Vegan'));
    expect(onRestrictionToggle).toHaveBeenCalledWith('vegan');
  });

  it('calls onSelect when a category checkbox is changed', () => {
    const onSelect = jest.fn();
    render(<CategorySidebar {...defaultProps} onSelect={onSelect} />);
    fireEvent.click(screen.getByLabelText('Beef'));
    expect(onSelect).toHaveBeenCalledWith('Beef');
  });

  it('checks the checkbox for selected categories', () => {
    render(<CategorySidebar {...defaultProps} selected={['Chicken']} />);
    expect(screen.getByLabelText('Chicken')).toBeChecked();
    expect(screen.getByLabelText('Vegetarian')).not.toBeChecked();
  });
});
