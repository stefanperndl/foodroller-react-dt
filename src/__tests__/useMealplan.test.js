import { renderHook, act } from '@testing-library/react';
import { useMealplan } from '../hooks/useMealplan';

const KEY = 'mealplan_v1';

beforeEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
});

describe('useMealplan', () => {
  it('initialises as empty object when localStorage is empty', () => {
    const { result } = renderHook(() => useMealplan());
    expect(result.current[0]).toEqual({});
  });

  it('loads persisted mealplan from localStorage on mount', () => {
    const saved = { '2026-05-01': { name: 'Pasta', ingredients: [] } };
    localStorage.setItem(KEY, JSON.stringify(saved));
    const { result } = renderHook(() => useMealplan());
    expect(result.current[0]).toEqual(saved);
  });

  it('persists updates to localStorage', () => {
    const { result } = renderHook(() => useMealplan());
    act(() => {
      result.current[1]({ '2026-05-02': { name: 'Salad', ingredients: [] } });
    });
    const stored = JSON.parse(localStorage.getItem(KEY));
    expect(stored).toEqual({ '2026-05-02': { name: 'Salad', ingredients: [] } });
  });

  it('sets loaded to true after mount', async () => {
    const { result } = renderHook(() => useMealplan());
    expect(result.current[2]).toBe(true);
  });
});
