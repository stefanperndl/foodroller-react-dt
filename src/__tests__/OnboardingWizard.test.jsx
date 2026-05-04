import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import OnboardingWizard from '../components/OnboardingWizard';

const mockSignInWithGoogle = jest.fn();
const mockSignInWithEmail = jest.fn();
const mockSignUpWithEmail = jest.fn();
const mockSetMacroProfile = jest.fn();
const mockToggleRestriction = jest.fn();
const mockSetMealplan = jest.fn();
const mockOnClose = jest.fn();

jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    signInWithGoogle: mockSignInWithGoogle,
    signInWithEmail: mockSignInWithEmail,
    signUpWithEmail: mockSignUpWithEmail,
  }),
}));

jest.mock('../context/MacroContext', () => ({
  useMacroContext: () => ({
    setMacroProfile: mockSetMacroProfile,
    effectiveMacroProfile: null,
  }),
}));

jest.mock('../context/FilterContext', () => ({
  useFilterContext: () => ({
    selectedRestrictions: [],
    toggleRestriction: mockToggleRestriction,
  }),
}));

jest.mock('../context/MealPlanContext', () => ({
  useMealPlanContext: () => ({ setMealplan: mockSetMealplan }),
}));

jest.mock('../lib/firebase', () => ({ db: {} }));
jest.mock('firebase/firestore', () => ({ doc: jest.fn(), setDoc: jest.fn() }));
jest.mock('../api/planner', () => ({ generateMealPlan: jest.fn() }));
jest.mock('../hooks/useMealSlots', () => ({ DEFAULT_SLOTS: [] }));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('OnboardingWizard', () => {
  it('renders step 0 on mount', () => {
    render(<OnboardingWizard onClose={mockOnClose} />);
    expect(screen.getByText('Welcome to FoodRoller')).toBeInTheDocument();
  });

  it('"Continue as guest" advances to step 1', () => {
    render(<OnboardingWizard onClose={mockOnClose} />);
    fireEvent.click(screen.getByText('Continue as guest →'));
    expect(screen.getByText("What's your goal?")).toBeInTheDocument();
  });

  it('Google sign-in button calls signInWithGoogle', () => {
    mockSignInWithGoogle.mockResolvedValue(undefined);
    render(<OnboardingWizard onClose={mockOnClose} />);
    fireEvent.click(screen.getByText('Continue with Google'));
    expect(mockSignInWithGoogle).toHaveBeenCalled();
  });

  it('step 1: Next disabled until goal selected', () => {
    render(<OnboardingWizard onClose={mockOnClose} />);
    fireEvent.click(screen.getByText('Continue as guest →'));
    const nextBtn = screen.getByText('Next →');
    expect(nextBtn).toBeDisabled();
    fireEvent.click(screen.getByText('Maintain'));
    expect(nextBtn).not.toBeDisabled();
  });

  it('step 2: Calculate targets button enabled after biometric inputs', () => {
    render(<OnboardingWizard onClose={mockOnClose} />);
    fireEvent.click(screen.getByText('Continue as guest →'));
    fireEvent.click(screen.getByText('Maintain'));
    fireEvent.click(screen.getByText('Next →'));

    expect(screen.getByText('Set your targets')).toBeInTheDocument();
    const calcBtn = screen.getByText('Calculate targets');
    expect(calcBtn).toBeDisabled();

    fireEvent.change(screen.getByPlaceholderText('years'), { target: { value: '30' } });
    fireEvent.change(screen.getByPlaceholderText('kg'), { target: { value: '75' } });
    fireEvent.change(screen.getByPlaceholderText('cm'), { target: { value: '175' } });
    expect(calcBtn).not.toBeDisabled();
  });

  it('close button calls onClose', () => {
    render(<OnboardingWizard onClose={mockOnClose} />);
    fireEvent.click(screen.getByLabelText('Close'));
    expect(mockOnClose).toHaveBeenCalledWith({ completedSteps: 0 });
  });

  it('skip button calls onClose with current step', () => {
    render(<OnboardingWizard onClose={mockOnClose} />);
    fireEvent.click(screen.getByText('Continue as guest →'));
    fireEvent.click(screen.getByText('Skip for now'));
    expect(mockOnClose).toHaveBeenCalledWith({ completedSteps: 1 });
  });

  it('step 3: restriction toggles work', () => {
    render(<OnboardingWizard onClose={mockOnClose} />);
    fireEvent.click(screen.getByText('Continue as guest →'));
    fireEvent.click(screen.getByText('Maintain'));
    fireEvent.click(screen.getByText('Next →'));

    fireEvent.change(screen.getByPlaceholderText('years'), { target: { value: '25' } });
    fireEvent.change(screen.getByPlaceholderText('kg'), { target: { value: '70' } });
    fireEvent.change(screen.getByPlaceholderText('cm'), { target: { value: '170' } });
    fireEvent.click(screen.getByText('Calculate targets'));
    fireEvent.click(screen.getByText('Next →'));

    expect(screen.getByText('Any dietary restrictions?')).toBeInTheDocument();
    expect(screen.getByText('None')).toHaveClass('active');
    fireEvent.click(screen.getByText('Vegetarian'));
    expect(screen.getByText('Vegetarian')).toHaveClass('active');
    expect(screen.getByText('None')).not.toHaveClass('active');
  });
});
