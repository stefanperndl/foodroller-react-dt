import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../context/AuthContext';

// Mock Firebase auth
jest.mock('../lib/firebase', () => ({ auth: {}, googleProvider: {} }));

const mockOnAuthStateChanged = jest.fn();
const mockSignInWithPopup     = jest.fn();
const mockSignInWithEmail     = jest.fn();
const mockCreateUser          = jest.fn();
const mockSignOut             = jest.fn();

jest.mock('firebase/auth', () => ({
  onAuthStateChanged:             (...args) => mockOnAuthStateChanged(...args),
  signInWithPopup:                (...args) => mockSignInWithPopup(...args),
  signInWithEmailAndPassword:     (...args) => mockSignInWithEmail(...args),
  createUserWithEmailAndPassword: (...args) => mockCreateUser(...args),
  signOut:                        (...args) => mockSignOut(...args),
}));

function TestConsumer() {
  const { user, loading, signInWithGoogle, signOut } = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="user">{user ? user.email : 'none'}</span>
      <button onClick={signInWithGoogle}>google</button>
      <button onClick={signOut}>signout</button>
    </div>
  );
}

function setup(authUser = null) {
  let authCallback;
  mockOnAuthStateChanged.mockImplementation((auth, cb) => {
    authCallback = cb;
    // Simulate async auth state resolution
    setTimeout(() => cb(authUser), 0);
    return jest.fn(); // unsubscribe
  });
  return { triggerAuth: (u) => act(() => authCallback(u)) };
}

beforeEach(() => jest.clearAllMocks());

describe('AuthContext', () => {
  it('starts in loading state, resolves to no user', async () => {
    setup(null);
    render(<AuthProvider><TestConsumer /></AuthProvider>);
    expect(screen.getByTestId('loading').textContent).toBe('true');
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
    expect(screen.getByTestId('user').textContent).toBe('none');
  });

  it('exposes signed-in user after auth state change', async () => {
    setup({ email: 'test@example.com' });
    render(<AuthProvider><TestConsumer /></AuthProvider>);
    await waitFor(() =>
      expect(screen.getByTestId('user').textContent).toBe('test@example.com')
    );
  });

  it('calls signInWithPopup when signInWithGoogle invoked', async () => {
    setup(null);
    mockSignInWithPopup.mockResolvedValue({ user: { email: 'g@example.com' } });
    render(<AuthProvider><TestConsumer /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
    fireEvent.click(screen.getByText('google'));
    expect(mockSignInWithPopup).toHaveBeenCalled();
  });

  it('calls firebaseSignOut when signOut invoked', async () => {
    setup(null);
    mockSignOut.mockResolvedValue(undefined);
    render(<AuthProvider><TestConsumer /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
    fireEvent.click(screen.getByText('signout'));
    expect(mockSignOut).toHaveBeenCalled();
  });
});
