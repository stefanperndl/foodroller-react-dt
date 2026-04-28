import { render, screen, fireEvent } from '@testing-library/react';
import PlannerModal from '../components/PlannerModal';
import { generateMealPlan } from '../api/planner';

jest.mock('../api/planner', () => ({
  generateMealPlan: jest.fn(),
}));

const macroProfile = { kcal: 2000, protein: 150, carbs: 200, fat: 60 };

const defaultProps = {
  macroProfile,
  startDate: '2026-04-28',
  endDate: '2026-04-29',
  selectedCategories: [],
  selectedRestrictions: [],
  onApply: jest.fn(),
  onClose: jest.fn(),
};

beforeEach(() => jest.clearAllMocks());

describe('PlannerModal', () => {
  it('renders macro targets', () => {
    render(<PlannerModal {...defaultProps} />);
    expect(screen.getByText(/2000 kcal/)).toBeInTheDocument();
    expect(screen.getByText(/150g protein/)).toBeInTheDocument();
    expect(screen.getByText(/200g carbs/)).toBeInTheDocument();
    expect(screen.getByText(/60g fat/)).toBeInTheDocument();
  });

  it('shows generate button in idle state', () => {
    render(<PlannerModal {...defaultProps} />);
    expect(screen.getByText('Generate plan')).toBeInTheDocument();
  });

  it('shows spinner while generating', async () => {
    generateMealPlan.mockImplementation(
      ({ onProgress }) =>
        new Promise((resolve) => {
          onProgress('Fetching recipe candidates…');
          setTimeout(resolve, 5000);
        })
    );
    render(<PlannerModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Generate plan'));
    await screen.findByText('Fetching recipe candidates…');
    expect(screen.getByTestId('planner-spinner')).toBeInTheDocument();
  });

  it('shows results and apply button after success', async () => {
    generateMealPlan.mockResolvedValue({
      '2026-04-28': { name: 'Butter Chicken', nutrition: { kcal: 450, protein: 35, carbs: 40, fat: 12 } },
      '2026-04-29': { name: 'Pasta Bolognese', nutrition: { kcal: 520, protein: 28, carbs: 60, fat: 15 } },
    });
    render(<PlannerModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Generate plan'));
    await screen.findByText('Butter Chicken');
    expect(screen.getByText('Pasta Bolognese')).toBeInTheDocument();
    expect(screen.getByText('Apply plan')).toBeInTheDocument();
  });

  it('calls onApply and onClose when apply is clicked', async () => {
    const plan = {
      '2026-04-28': { name: 'Butter Chicken', nutrition: { kcal: 450, protein: 35, carbs: 40, fat: 12 } },
    };
    generateMealPlan.mockResolvedValue(plan);
    render(<PlannerModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Generate plan'));
    await screen.findByText('Apply plan');
    fireEvent.click(screen.getByText('Apply plan'));
    expect(defaultProps.onApply).toHaveBeenCalledWith(plan);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('shows error message on failure with retry button', async () => {
    generateMealPlan.mockRejectedValue(new Error('Not enough recipes available.'));
    render(<PlannerModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Generate plan'));
    await screen.findByText('Not enough recipes available.');
    expect(screen.getByText('Try again')).toBeInTheDocument();
  });

  it('calls onClose when overlay is clicked', () => {
    render(<PlannerModal {...defaultProps} />);
    fireEvent.click(screen.getByTestId('planner-overlay'));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('calls onClose when × button is clicked', () => {
    render(<PlannerModal {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('Close'));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('allows regeneration after success', async () => {
    const plan = {
      '2026-04-28': { name: 'Butter Chicken', nutrition: { kcal: 450, protein: 35, carbs: 40, fat: 12 } },
    };
    generateMealPlan.mockResolvedValue(plan);
    render(<PlannerModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Generate plan'));
    await screen.findByText('Regenerate');
    fireEvent.click(screen.getByText('Regenerate'));
    expect(generateMealPlan).toHaveBeenCalledTimes(2);
  });
});
