import { render, screen, fireEvent } from '@testing-library/react';
import { FilterBar } from '../components/FilterBar';

const categories = [
  { idCategory: '1', strCategory: 'Beef' },
  { idCategory: '2', strCategory: 'Vegetarian' },
  { idCategory: '3', strCategory: 'Chicken' },
];

const defaultProps = {
  categories,
  selectedCategories: [],
  restrictions: [],
  onRestrictionToggle: jest.fn(),
  onSelect: jest.fn(),
  onClearCategories: jest.fn(),
};

beforeEach(() => jest.clearAllMocks());

describe('FilterBar', () => {
  it('renders dietary restriction chips', () => {
    render(<FilterBar {...defaultProps} />);
    expect(screen.getByTitle('Vegetarian')).toBeInTheDocument();
    expect(screen.getByTitle('Vegan')).toBeInTheDocument();
    expect(screen.getByTitle('Pescatarian')).toBeInTheDocument();
  });

  it('marks active restriction chip', () => {
    render(<FilterBar {...defaultProps} restrictions={['vegetarian']} />);
    expect(screen.getByTitle('Vegetarian').className).toContain('active');
    expect(screen.getByTitle('Vegan').className).not.toContain('active');
  });

  it('calls onRestrictionToggle with the restriction key', () => {
    const onRestrictionToggle = jest.fn();
    render(<FilterBar {...defaultProps} onRestrictionToggle={onRestrictionToggle} />);
    fireEvent.click(screen.getByTitle('Vegan'));
    expect(onRestrictionToggle).toHaveBeenCalledWith('vegan');
  });

  it('renders Categories button', () => {
    render(<FilterBar {...defaultProps} />);
    expect(screen.getByText(/Categories/i)).toBeInTheDocument();
  });

  it('opens category popover on button click', () => {
    render(<FilterBar {...defaultProps} />);
    fireEvent.click(screen.getByText(/Categories/i));
    expect(screen.getByText('Beef')).toBeInTheDocument();
    expect(screen.getByText('Vegetarian')).toBeInTheDocument();
    expect(screen.getByText('Chicken')).toBeInTheDocument();
  });

  it('hides incompatible categories when restriction is active', () => {
    render(<FilterBar {...defaultProps} restrictions={['vegetarian']} />);
    fireEvent.click(screen.getByText(/Categories/i));
    expect(screen.queryByText('Beef')).not.toBeInTheDocument();
    expect(screen.queryByText('Chicken')).not.toBeInTheDocument();
    expect(screen.getByText('Vegetarian')).toBeInTheDocument();
  });

  it('calls onSelect when a category chip is clicked', () => {
    const onSelect = jest.fn();
    render(<FilterBar {...defaultProps} onSelect={onSelect} />);
    fireEvent.click(screen.getByText(/Categories/i));
    fireEvent.click(screen.getByText('Beef'));
    expect(onSelect).toHaveBeenCalledWith('Beef');
  });

  it('shows count badge when categories are selected', () => {
    render(<FilterBar {...defaultProps} selectedCategories={['Beef', 'Chicken']} />);
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('calls onClearCategories when Clear is clicked', () => {
    const onClearCategories = jest.fn();
    render(<FilterBar {...defaultProps} selectedCategories={['Beef']} onClearCategories={onClearCategories} />);
    fireEvent.click(screen.getByText(/Categories/i));
    fireEvent.click(screen.getByText('Clear'));
    expect(onClearCategories).toHaveBeenCalled();
  });
});
