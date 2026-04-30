import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ClientManagerModal from '../components/ClientManagerModal';
import { useMacroContext } from '../context/MacroContext';

jest.mock('../context/MacroContext', () => ({
  useMacroContext: jest.fn(),
}));

const mockClients = [
  { id: 'c1', name: 'Alice', kcal: 2000, protein: 150, carbs: 200, fat: 70, goal: 'lose', restrictions: [], notes: 'Test note' },
  { id: 'c2', name: 'Bob',   kcal: 2500, protein: 180, carbs: 280, fat: 80, goal: 'gain', restrictions: ['vegetarian'], notes: '' },
];

const mockAddClient    = jest.fn().mockResolvedValue(undefined);
const mockUpdateClient = jest.fn().mockResolvedValue(undefined);
const mockDeleteClient = jest.fn().mockResolvedValue(undefined);
const mockSetActiveClient = jest.fn();
const mockOnClose = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  useMacroContext.mockReturnValue({
    clients: mockClients,
    addClient: mockAddClient,
    updateClient: mockUpdateClient,
    deleteClient: mockDeleteClient,
    setActiveClient: mockSetActiveClient,
  });
});

describe('ClientManagerModal — list view', () => {
  it('renders client names in the sidebar', () => {
    render(<ClientManagerModal onClose={mockOnClose} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('renders macro summary for each client', () => {
    render(<ClientManagerModal onClose={mockOnClose} />);
    expect(screen.getByText(/2000 kcal/)).toBeInTheDocument();
    expect(screen.getByText(/2500 kcal/)).toBeInTheDocument();
  });

  it('calls setActiveClient and onClose when "Plan for client →" is clicked', () => {
    render(<ClientManagerModal onClose={mockOnClose} />);
    fireEvent.click(screen.getAllByText('Plan for client →')[0]);
    expect(mockSetActiveClient).toHaveBeenCalledWith(mockClients[0]);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('shows empty state when no clients', () => {
    useMacroContext.mockReturnValue({
      clients: [],
      addClient: mockAddClient,
      updateClient: mockUpdateClient,
      deleteClient: mockDeleteClient,
      setActiveClient: mockSetActiveClient,
    });
    render(<ClientManagerModal onClose={mockOnClose} />);
    expect(screen.getByText(/No clients yet/)).toBeInTheDocument();
  });
});

describe('ClientManagerModal — add form', () => {
  it('opens empty add form when "+ Add" is clicked', () => {
    render(<ClientManagerModal onClose={mockOnClose} />);
    fireEvent.click(screen.getByText('+ Add'));
    expect(screen.getByText('New client')).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toHaveValue('');
  });

  it('calls addClient with correct shape on form submission', async () => {
    render(<ClientManagerModal onClose={mockOnClose} />);
    fireEvent.click(screen.getByText('+ Add'));

    fireEvent.change(screen.getByLabelText('Name'),         { target: { value: 'Carol' } });
    fireEvent.change(screen.getByLabelText('kcal / day'),   { target: { value: '1800' } });
    fireEvent.change(screen.getByLabelText('Protein (g)'),  { target: { value: '130' } });
    fireEvent.change(screen.getByLabelText('Carbs (g)'),    { target: { value: '180' } });
    fireEvent.change(screen.getByLabelText('Fat (g)'),      { target: { value: '60' } });

    fireEvent.click(screen.getByText('Add client'));

    await waitFor(() => expect(mockAddClient).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Carol', kcal: 1800, protein: 130, carbs: 180, fat: 60 })
    ));
  });
});

describe('ClientManagerModal — edit form', () => {
  it('pre-fills form with client data when edit icon is clicked', () => {
    render(<ClientManagerModal onClose={mockOnClose} />);
    fireEvent.click(screen.getAllByLabelText('Edit client')[0]);
    expect(screen.getByText(/Edit — Alice/)).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toHaveValue('Alice');
    expect(screen.getByLabelText('kcal / day').value).toBe('2000');
  });

  it('calls updateClient with client id and updated data on submit', async () => {
    render(<ClientManagerModal onClose={mockOnClose} />);
    fireEvent.click(screen.getAllByLabelText('Edit client')[0]);
    fireEvent.change(screen.getByLabelText('kcal / day'), { target: { value: '1900' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(mockUpdateClient).toHaveBeenCalledWith(
      'c1',
      expect.objectContaining({ name: 'Alice', kcal: 1900 })
    ));
  });
});

describe('ClientManagerModal — delete flow', () => {
  it('shows inline confirmation when delete icon is clicked', () => {
    render(<ClientManagerModal onClose={mockOnClose} />);
    fireEvent.click(screen.getAllByLabelText('Delete client')[0]);
    expect(screen.getByText(/Delete Alice\?/)).toBeInTheDocument();
  });

  it('calls deleteClient when confirmed', async () => {
    render(<ClientManagerModal onClose={mockOnClose} />);
    fireEvent.click(screen.getAllByLabelText('Delete client')[0]);
    fireEvent.click(screen.getByText('Delete'));

    await waitFor(() => expect(mockDeleteClient).toHaveBeenCalledWith('c1'));
  });

  it('cancels delete when Cancel is clicked', () => {
    render(<ClientManagerModal onClose={mockOnClose} />);
    fireEvent.click(screen.getAllByLabelText('Delete client')[0]);
    fireEvent.click(screen.getByText('Cancel'));
    expect(mockDeleteClient).not.toHaveBeenCalled();
    expect(screen.queryByText(/Delete Alice\?/)).not.toBeInTheDocument();
  });
});

describe('ClientManagerModal — close', () => {
  it('calls onClose when close button is clicked', () => {
    render(<ClientManagerModal onClose={mockOnClose} />);
    fireEvent.click(screen.getByLabelText('Close'));
    expect(mockOnClose).toHaveBeenCalled();
  });
});
