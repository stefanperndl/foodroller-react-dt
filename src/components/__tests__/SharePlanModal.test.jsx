import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useAuth } from '../../context/AuthContext';
import { useMacroContext } from '../../context/MacroContext';
import { useMealPlanContext } from '../../context/MealPlanContext';
import SharePlanModal from '../SharePlanModal';
import * as shareUtils from '../../utils/shareUtils';

jest.mock('../../utils/shareUtils');
jest.mock('../../lib/firebase', () => ({ db: null, auth: null, googleProvider: null }));
jest.mock('../../context/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('../../context/MacroContext', () => ({ useMacroContext: jest.fn() }));
jest.mock('../../context/MealPlanContext', () => ({ useMealPlanContext: jest.fn() }));

const mockUser = { uid: 'user-1', displayName: 'Test Dietitian' };

beforeEach(() => {
  jest.clearAllMocks();
  useAuth.mockReturnValue({ user: mockUser });
  useMacroContext.mockReturnValue({ effectiveMacroProfile: null });
  useMealPlanContext.mockReturnValue({
    mealplan: { '2026-04-28': { dinner: { id: '1', name: 'Pasta', ingredients: ['100g pasta'], image: '' } } },
    slots: [{ id: 'dinner', label: 'Dinner', order: 0 }],
    nutritionMap: {},
  });
  Object.assign(navigator, { clipboard: { writeText: jest.fn().mockResolvedValue(undefined) } });
});

function renderModal(props = {}) {
  return render(
    <SharePlanModal startDate="2026-04-28" endDate="2026-05-02" onClose={jest.fn()} {...props} />
  );
}

describe('SharePlanModal', () => {
  it('renders heading and date range inputs', () => {
    renderModal();
    expect(screen.getByText('Share Meal Plan')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2026-04-28')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2026-05-02')).toBeInTheDocument();
  });

  it('generates and displays share URL on success', async () => {
    shareUtils.createShareableLink.mockResolvedValue('test-share-id');
    renderModal();

    fireEvent.click(screen.getByRole('button', { name: /generate link/i }));

    const urlInput = await screen.findByDisplayValue(/\/plan\/test-share-id/);
    expect(urlInput).toBeInTheDocument();
    expect(screen.getByText(/link expires in 30 days/i)).toBeInTheDocument();
  });

  it('calls createShareableLink with correct ownerId and displayName', async () => {
    shareUtils.createShareableLink.mockResolvedValue('abc');
    renderModal();

    fireEvent.click(screen.getByRole('button', { name: /generate link/i }));

    await waitFor(() => expect(shareUtils.createShareableLink).toHaveBeenCalledTimes(1));
    const arg = shareUtils.createShareableLink.mock.calls[0][0];
    expect(arg.ownerId).toBe('user-1');
    expect(arg.ownerDisplayName).toBe('Test Dietitian');
  });

  it('copies URL to clipboard when copy button clicked', async () => {
    shareUtils.createShareableLink.mockResolvedValue('copy-id');
    renderModal();

    fireEvent.click(screen.getByRole('button', { name: /generate link/i }));
    await screen.findByDisplayValue(/\/plan\/copy-id/);

    fireEvent.click(screen.getByTitle('Copy link'));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      expect.stringContaining('/plan/copy-id')
    );
  });

  it('shows error message on failure', async () => {
    shareUtils.createShareableLink.mockRejectedValue(new Error('Firestore error'));
    renderModal();

    fireEvent.click(screen.getByRole('button', { name: /generate link/i }));

    const error = await screen.findByText(/failed to generate link/i);
    expect(error).toBeInTheDocument();
  });

  it('calls onClose when close button clicked', () => {
    const onClose = jest.fn();
    renderModal({ onClose });
    fireEvent.click(screen.getByLabelText('Close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('resets to generate form when "Generate another link" clicked', async () => {
    shareUtils.createShareableLink.mockResolvedValue('reset-id');
    renderModal();

    fireEvent.click(screen.getByRole('button', { name: /generate link/i }));
    const resetBtn = await screen.findByText(/generate another link/i);
    fireEvent.click(resetBtn);

    expect(screen.getByRole('button', { name: /generate link/i })).toBeInTheDocument();
  });
});
