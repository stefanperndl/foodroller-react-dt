import { render, screen, fireEvent } from '@testing-library/react';
import AuthModal from '../components/AuthModal';

const mockSignInWithGoogle = jest.fn();
const mockSignInWithEmail = jest.fn();
const mockSignUpWithEmail = jest.fn();

jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    signInWithGoogle: mockSignInWithGoogle,
    signInWithEmail: mockSignInWithEmail,
    signUpWithEmail: mockSignUpWithEmail,
  }),
}));

beforeEach(() => jest.clearAllMocks());

describe('AuthModal', () => {
  it('renders Google tab by default', () => {
    render(<AuthModal onClose={() => {}} />);
    expect(screen.getByText('Continue with Google')).toBeInTheDocument();
  });

  it('switches to email tab', () => {
    render(<AuthModal onClose={() => {}} />);
    fireEvent.click(screen.getByText('Email'));
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
  });

  it('does not show confirm field in signin mode', () => {
    render(<AuthModal onClose={() => {}} />);
    fireEvent.click(screen.getByText('Email'));
    expect(screen.queryByPlaceholderText('Confirm password')).toBeNull();
  });

  it('shows confirm password field after switching to signup mode', () => {
    render(<AuthModal onClose={() => {}} />);
    fireEvent.click(screen.getByText('Email'));
    fireEvent.click(screen.getByText("Don't have an account? Sign up"));
    expect(screen.getByPlaceholderText('Confirm password')).toBeInTheDocument();
  });

  it('shows error when passwords do not match', () => {
    render(<AuthModal onClose={() => {}} />);
    fireEvent.click(screen.getByText('Email'));
    fireEvent.click(screen.getByText("Don't have an account? Sign up"));
    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'pass123' } });
    fireEvent.change(screen.getByPlaceholderText('Confirm password'), { target: { value: 'other' } });
    fireEvent.click(screen.getByText('Create account'));
    expect(screen.getByText('Passwords do not match.')).toBeInTheDocument();
    expect(mockSignUpWithEmail).not.toHaveBeenCalled();
  });

  it('calls onClose when × button is clicked', () => {
    const onClose = jest.fn();
    render(<AuthModal onClose={onClose} />);
    fireEvent.click(screen.getByLabelText('Close'));
    expect(onClose).toHaveBeenCalled();
  });

  it('switches title when toggling to signup mode', () => {
    render(<AuthModal onClose={() => {}} />);
    expect(screen.getByText('Sign in to FoodRoller')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Email'));
    fireEvent.click(screen.getByText("Don't have an account? Sign up"));
    expect(screen.getByText('Create your account')).toBeInTheDocument();
  });
});
