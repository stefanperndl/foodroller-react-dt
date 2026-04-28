import { render, screen, fireEvent } from '@testing-library/react';
import UserMenu from '../components/UserMenu';

const mockSignOut = jest.fn();

jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: mockUser, signOut: mockSignOut }),
}));

let mockUser = null;

beforeEach(() => {
  mockSignOut.mockClear();
  mockUser = { displayName: 'Stefan Perndl', email: 'stefan@test.com', photoURL: null };
});

describe('UserMenu', () => {
  it('renders nothing when user is null', () => {
    mockUser = null;
    const { container } = render(<UserMenu />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders initials avatar from displayName', () => {
    render(<UserMenu />);
    expect(screen.getByText('SP')).toBeInTheDocument();
  });

  it('renders initial from email when no displayName', () => {
    mockUser = { displayName: null, email: 'hello@test.com', photoURL: null };
    render(<UserMenu />);
    expect(screen.getByText('H')).toBeInTheDocument();
  });

  it('opens dropdown showing name and email', () => {
    render(<UserMenu />);
    fireEvent.click(screen.getByRole('button', { name: /user menu/i }));
    expect(screen.getByText('Stefan Perndl')).toBeInTheDocument();
    expect(screen.getByText('stefan@test.com')).toBeInTheDocument();
  });

  it('calls signOut when Sign out is clicked', () => {
    render(<UserMenu />);
    fireEvent.click(screen.getByRole('button', { name: /user menu/i }));
    fireEvent.click(screen.getByText('Sign out'));
    expect(mockSignOut).toHaveBeenCalled();
  });

  it('closes dropdown when backdrop is clicked', () => {
    render(<UserMenu />);
    fireEvent.click(screen.getByRole('button', { name: /user menu/i }));
    expect(screen.getByText('Sign out')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Sign out').closest('.user-menu-dropdown').previousSibling);
    expect(screen.queryByText('Sign out')).toBeNull();
  });
});
