import { renderHook, act, waitFor } from '@testing-library/react';
import { useMealplan } from '../hooks/useMealplan';
import { getDoc, setDoc } from 'firebase/firestore';

// Mock Firebase so tests run without a real project config
jest.mock('../lib/firebase', () => ({ db: {} }));
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
}));

const KEY = 'mealplan_v1';

beforeEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
});

describe('useMealplan — anonymous (no user)', () => {
  it('initialises as empty when localStorage is empty', () => {
    const { result } = renderHook(() => useMealplan(null));
    expect(result.current[0]).toEqual({});
  });

  it('loads persisted data from localStorage', () => {
    const saved = { '2026-05-01': { name: 'Pasta', ingredients: [] } };
    localStorage.setItem(KEY, JSON.stringify(saved));
    const { result } = renderHook(() => useMealplan(null));
    expect(result.current[0]).toEqual(saved);
  });

  it('persists updates to localStorage', () => {
    const { result } = renderHook(() => useMealplan(null));
    act(() => {
      result.current[1]({ '2026-05-02': { name: 'Salad', ingredients: [] } });
    });
    expect(JSON.parse(localStorage.getItem(KEY))).toEqual({
      '2026-05-02': { name: 'Salad', ingredients: [] },
    });
  });

  it('does not call Firestore when no user', () => {
    renderHook(() => useMealplan(null));
    expect(getDoc).not.toHaveBeenCalled();
  });

  it('sets loaded to true after mount', () => {
    const { result } = renderHook(() => useMealplan(null));
    expect(result.current[2]).toBe(true);
  });
});

describe('useMealplan — signed in (with user)', () => {
  const user = { uid: 'user-123' };
  const cloudData = { '2026-05-03': { name: 'Cloud Meal', ingredients: [] } };

  it('loads mealplan from Firestore when user is signed in', async () => {
    getDoc.mockResolvedValue({ exists: () => true, data: () => ({ meals: cloudData }) });
    const { result } = renderHook(() => useMealplan(user));
    await waitFor(() => expect(result.current[2]).toBe(true));
    expect(result.current[0]).toEqual(cloudData);
  });

  it('migrates localStorage data to Firestore on first sign-in (empty cloud)', async () => {
    const localData = { '2026-05-04': { name: 'Local Meal', ingredients: [] } };
    localStorage.setItem(KEY, JSON.stringify(localData));
    getDoc.mockResolvedValue({ exists: () => false });
    setDoc.mockResolvedValue(undefined);

    const { result } = renderHook(() => useMealplan(user));
    await waitFor(() => expect(result.current[2]).toBe(true));

    expect(result.current[0]).toEqual(localData);
    expect(setDoc).toHaveBeenCalled();
  });

  it('syncs updates to Firestore', async () => {
    getDoc.mockResolvedValue({ exists: () => true, data: () => ({ meals: {} }) });
    setDoc.mockResolvedValue(undefined);

    const { result } = renderHook(() => useMealplan(user));
    await waitFor(() => expect(result.current[2]).toBe(true));

    act(() => {
      result.current[1]({ '2026-05-05': { name: 'New Meal', ingredients: [] } });
    });

    expect(setDoc).toHaveBeenCalledWith(
      undefined, // doc() is mocked to return undefined
      { meals: { '2026-05-05': { name: 'New Meal', ingredients: [] } } }
    );
  });

  it('falls back to localStorage if Firestore fails', async () => {
    const localData = { '2026-05-06': { name: 'Fallback', ingredients: [] } };
    localStorage.setItem(KEY, JSON.stringify(localData));
    getDoc.mockRejectedValue(new Error('network error'));

    const { result } = renderHook(() => useMealplan(user));
    await waitFor(() => expect(result.current[2]).toBe(true));
    expect(result.current[0]).toEqual(localData);
  });

  it('clears mealplan and localStorage when user signs out', async () => {
    getDoc.mockResolvedValue({ exists: () => true, data: () => ({ meals: cloudData }) });
    let currentUser = user;
    const { result, rerender } = renderHook(() => useMealplan(currentUser));
    await waitFor(() => expect(result.current[2]).toBe(true));
    expect(result.current[0]).toEqual(cloudData);

    // Sign out
    currentUser = null;
    rerender();
    await waitFor(() => expect(result.current[2]).toBe(true));

    expect(result.current[0]).toEqual({});
    expect(localStorage.getItem(KEY)).toBeNull();
  });
});
