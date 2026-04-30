import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ClientManagerModal from '../components/ClientManagerModal';

const mockClients = [
  { id: 'c1', name: 'Alice', kcal: 2000, protein: 150, carbs: 200, fat: 70, goal: 'lose', restrictions: [], notes: 'Test note' },
  { id: 'c2', name: 'Bob',   kcal: 2500, protein: 180, carbs: 280, fat: 80, goal: 'gain', restrictions: ['vegetarian'], notes: '' },
];

const defaultProps = {
  clients:        mockClients,
  onAdd:          jest.fn().mockResolvedValue(undefined),
  onUpdate:       jest.fn().mockResolvedValue(undefined),
  onDelete:       jest.fn().mockResolvedValue(undefined),
  onSelectClient: jest.fn(),
  onClose:        jest.fn(),
};

beforeEach(() => jest.clearAllMocks());

describe('ClientManagerModal — list view', () => {
  it('renders client names in the sidebar', () => {
    render(<ClientManagerModal {...defaultProps} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('renders macro summary for each client', () => {
    render(<ClientManagerModal {...defaultProps} />);
    expect(screen.getByText(/2000 kcal/)).toBeInTheDocument();
    expect(screen.getByText(/2500 kcal/)).toBeInTheDocument();
  });

  it('calls onSelectClient and onClose when "Plan for client →" is clicked', () => {
    render(<ClientManagerModal {...defaultProps} />);
    fireEvent.click(screen.getAllByText('Plan for client →')[0]);
    expect(defaultProps.onSelectClient).toHaveBeenCalledWith(mockClients[0]);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('shows empty state when no clients', () => {
    render(<ClientManagerModal {...defaultProps} clients={[]} />);
    expect(screen.getByText(/No clients yet/)).toBeInTheDocument();
  });
});

describe('ClientManagerModal — add form', () => {
  it('opens empty add form when "+ Add" is clicked', () => {
    render(<ClientManagerModal {...defaultProps} />);
    fireEvent.click(screen.getByText('+ Add'));
    expect(screen.getByText('New client')).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toHaveValue('');
  });

  it('calls onAdd with correct shape on form submission', async () => {
    render(<ClientManagerModal {...defaultProps} />);
    fireEvent.click(screen.getByText('+ Add'));

    fireEvent.change(screen.getByLabelText('Name'),         { target: { value: 'Carol' } });
    fireEvent.change(screen.getByLabelText('kcal / day'),   { target: { value: '1800' } });
    fireEvent.change(screen.getByLabelText('Protein (g)'),  { target: { value: '130' } });
    fireEvent.change(screen.getByLabelText('Carbs (g)'),    { target: { value: '180' } });
    fireEvent.change(screen.getByLabelText('Fat (g)'),      { target: { value: '60' } });

    fireEvent.click(screen.getByText('Add client'));

    await waitFor(() => expect(defaultProps.onAdd).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Carol', kcal: 1800, protein: 130, carbs: 180, fat: 60 })
    ));
  });
});

describe('ClientManagerModal — edit form', () => {
  it('pre-fills form with client data when edit icon is clicked', () => {
    render(<ClientManagerModal {...defaultProps} />);
    fireEvent.click(screen.getAllByLabelText('Edit client')[0]);
    expect(screen.getByText(/Edit — Alice/)).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toHaveValue('Alice');
    expect(screen.getByLabelText('kcal / day').value).toBe('2000');
  });

  it('calls onUpdate with client id and updated data on submit', async () => {
    render(<ClientManagerModal {...defaultProps} />);
    fireEvent.click(screen.getAllByLabelText('Edit client')[0]);
    fireEvent.change(screen.getByLabelText('kcal / day'), { target: { value: '1900' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(defaultProps.onUpdate).toHaveBeenCalledWith(
      'c1',
      expect.objectContaining({ name: 'Alice', kcal: 1900 })
    ));
  });
});

describe('ClientManagerModal — delete flow', () => {
  it('shows inline confirmation when delete icon is clicked', () => {
    render(<ClientManagerModal {...defaultProps} />);
    fireEvent.click(screen.getAllByLabelText('Delete client')[0]);
    expect(screen.getByText(/Delete Alice\?/)).toBeInTheDocument();
  });

  it('calls onDelete when confirmed', async () => {
    render(<ClientManagerModal {...defaultProps} />);
    fireEvent.click(screen.getAllByLabelText('Delete client')[0]);
    fireEvent.click(screen.getByText('Delete'));

    await waitFor(() => expect(defaultProps.onDelete).toHaveBeenCalledWith('c1'));
  });

  it('cancels delete when Cancel is clicked', () => {
    render(<ClientManagerModal {...defaultProps} />);
    fireEvent.click(screen.getAllByLabelText('Delete client')[0]);
    fireEvent.click(screen.getByText('Cancel'));
    expect(defaultProps.onDelete).not.toHaveBeenCalled();
    expect(screen.queryByText(/Delete Alice\?/)).not.toBeInTheDocument();
  });
});

describe('ClientManagerModal — close', () => {
  it('calls onClose when close button is clicked', () => {
    render(<ClientManagerModal {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('Close'));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});
