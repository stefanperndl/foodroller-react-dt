import { renderHook, act, waitFor } from '@testing-library/react';
import { useOnboarding } from '../hooks/useOnboarding';
import { getDoc, setDoc } from 'firebase/firestore';

jest.mock('../lib/firebase', () => ({ db: {} }));
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
}));

beforeEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
});

describe('useOnboarding — no localStorage', () => {
  it('showOnboarding is true when key absent', () => {
    const { result } = renderHook(() => useOnboarding(null));
    expect(result.current.showOnboarding).toBe(true);
  });
});

describe('useOnboarding — localStorage dismissed', () => {
  it('showOnboarding is false when already dismissed', () => {
    localStorage.setItem('onboarding_v1', JSON.stringify({ dismissed: true }));
    const { result } = renderHook(() => useOnboarding(null));
    expect(result.current.showOnboarding).toBe(false);
  });
});

describe('useOnboarding — completeOnboarding', () => {
  it('sets showOnboarding false and writes localStorage', () => {
    const { result } = renderHook(() => useOnboarding(null));
    expect(result.current.showOnboarding).toBe(true);

    act(() => { result.current.completeOnboarding({ completedSteps: 5 }); });

    expect(result.current.showOnboarding).toBe(false);
    const stored = JSON.parse(localStorage.getItem('onboarding_v1'));
    expect(stored.dismissed).toBe(true);
    expect(stored.completedSteps).toBe(5);
  });

  it('writes to Firestore when user is set', () => {
    getDoc.mockResolvedValue({ exists: () => false });
    setDoc.mockResolvedValue(undefined);
    const user = { uid: 'u1' };
    const { result } = renderHook(() => useOnboarding(user));

    act(() => { result.current.completeOnboarding({ completedSteps: 3 }); });

    expect(setDoc).toHaveBeenCalledWith(undefined, expect.objectContaining({ dismissed: true, completedSteps: 3 }));
  });
});

describe('useOnboarding — signed-in user, Firestore dismissed', () => {
  it('suppresses wizard when Firestore doc has dismissed: true', async () => {
    getDoc.mockResolvedValue({ exists: () => true, data: () => ({ dismissed: true, completedAt: '2026-01-01T00:00:00.000Z', completedSteps: 5 }) });
    const user = { uid: 'u2' };
    const { result } = renderHook(() => useOnboarding(user));

    await waitFor(() => expect(result.current.showOnboarding).toBe(false));
  });
});

describe('useOnboarding — signed-in user, Firestore empty, localStorage dismissed', () => {
  it('syncs localStorage payload to Firestore', async () => {
    const payload = { dismissed: true, completedAt: '2026-01-01T00:00:00.000Z', completedSteps: 5 };
    localStorage.setItem('onboarding_v1', JSON.stringify(payload));
    getDoc.mockResolvedValue({ exists: () => false });
    setDoc.mockResolvedValue(undefined);

    const user = { uid: 'u3' };
    renderHook(() => useOnboarding(user));

    await waitFor(() => expect(setDoc).toHaveBeenCalledWith(undefined, payload));
  });
});
