import { render, screen, fireEvent } from '@testing-library/react';
import { FilterBar } from '../components/FilterBar';
import { useFilterContext } from '../context/FilterContext';

jest.mock('../context/FilterContext', () => ({
  useFilterContext: jest.fn(),
}));

const categories = [
  { idCategory: '1', strCategory: 'Beef' },
  { idCategory: '2', strCategory: 'Vegetarian' },
  { idCategory: '3', strCategory: 'Chicken' },
];

const mockToggleRestriction = jest.fn();
const mockToggleCategory = jest.fn();
const mockClearCategories = jest.fn();

function setDefaultMocks(overrides = {}) {
  useFilterContext.mockReturnValue({
    categories,
    selectedCategories: [],
    selectedRestrictions: [],
    toggleRestriction: mockToggleRestriction,
    toggleCategory: mockToggleCategory,
    clearCategories: mockClearCategories,
    ...overrides,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  setDefaultMocks();
});

describe('FilterBar', () => {
  it('renders dietary restriction chips', () => {
    render(<FilterBar />);
    expect(screen.getByTitle('Vegetarian')).toBeInTheDocument();
    expect(screen.getByTitle('Vegan')).toBeInTheDocument();
    expect(screen.getByTitle('Pescatarian')).toBeInTheDocument();
  });

  it('marks active restriction chip', () => {
    setDefaultMocks({ selectedRestrictions: ['vegetarian'] });
    render(<FilterBar />);
    expect(screen.getByTitle('Vegetarian').className).toContain('active');
    expect(screen.getByTitle('Vegan').className).not.toContain('active');
  });

  it('calls toggleRestriction with the restriction key', () => {
    render(<FilterBar />);
    fireEvent.click(screen.getByTitle('Vegan'));
    expect(mockToggleRestriction).toHaveBeenCalledWith('vegan');
  });

  it('renders Categories button', () => {
    render(<FilterBar />);
    expect(screen.getByText(/Categories/i)).toBeInTheDocument();
  });

  it('opens category popover on button click', () => {
    render(<FilterBar />);
    fireEvent.click(screen.getByText(/Categories/i));
    expect(screen.getByText('Beef')).toBeInTheDocument();
    expect(screen.getByText('Vegetarian')).toBeInTheDocument();
    expect(screen.getByText('Chicken')).toBeInTheDocument();
  });

  it('hides incompatible categories when restriction is active', () => {
    setDefaultMocks({ selectedRestrictions: ['vegetarian'] });
    render(<FilterBar />);
    fireEvent.click(screen.getByText(/Categories/i));
    expect(screen.queryByText('Beef')).not.toBeInTheDocument();
    expect(screen.queryByText('Chicken')).not.toBeInTheDocument();
    expect(screen.getByText('Vegetarian')).toBeInTheDocument();
  });

  it('calls toggleCategory when a category chip is clicked', () => {
    render(<FilterBar />);
    fireEvent.click(screen.getByText(/Categories/i));
    fireEvent.click(screen.getByText('Beef'));
    expect(mockToggleCategory).toHaveBeenCalledWith('Beef');
  });

  it('shows count badge when categories are selected', () => {
    setDefaultMocks({ selectedCategories: ['Beef', 'Chicken'] });
    render(<FilterBar />);
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('calls clearCategories when Clear is clicked', () => {
    setDefaultMocks({ selectedCategories: ['Beef'] });
    render(<FilterBar />);
    fireEvent.click(screen.getByText(/Categories/i));
    fireEvent.click(screen.getByText('Clear'));
    expect(mockClearCategories).toHaveBeenCalled();
  });
});
