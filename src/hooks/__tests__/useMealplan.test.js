import { renderHook, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useMealplan } from '../useMealplan';

jest.mock('../../lib/firebase', () => ({ db: {} }));
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(() => Promise.resolve({ exists: () => false })),
  setDoc: jest.fn(() => Promise.resolve()),
}));

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('useMealplan', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  it('initializes with empty meal plan', () => {
    const { result } = renderHook(() => useMealplan());
    const [mealplan] = result.current;
    
    expect(mealplan).toEqual({});
  });

  it('loads existing meal plan from localStorage', () => {
    const existingPlan = {
      '2025-10-27': { dinner: { id: '123', name: 'Test Meal' } },
    };
    localStorageMock.setItem('mealplan_v1', JSON.stringify(existingPlan));

    const { result } = renderHook(() => useMealplan());
    const [mealplan] = result.current;

    expect(mealplan).toEqual(existingPlan);
  });

  it('adds meal to specific date', () => {
    const { result } = renderHook(() => useMealplan());
    const meal = { id: '123', name: 'Test Meal', image: 'test.jpg' };
    
    act(() => {
      const [, setMealplan] = result.current;
      setMealplan(prev => ({ ...prev, '2025-10-27': meal }));
    });
    
    const [mealplan] = result.current;
    expect(mealplan['2025-10-27']).toEqual(meal);
  });

  it('removes meal from specific date', () => {
    const { result } = renderHook(() => useMealplan());
    const meal = { id: '123', name: 'Test Meal' };
    
    act(() => {
      const [, setMealplan] = result.current;
      setMealplan({ '2025-10-27': meal });
    });
    
    let [mealplan] = result.current;
    expect(mealplan['2025-10-27']).toEqual(meal);
    
    act(() => {
      const [, setMealplan] = result.current;
      setMealplan(prev => {
        const updated = { ...prev };
        delete updated['2025-10-27'];
        return updated;
      });
    });
    
    [mealplan] = result.current;
    expect(mealplan['2025-10-27']).toBeUndefined();
  });

  it('persists meal plan to localStorage', () => {
    const { result } = renderHook(() => useMealplan());
    const meal = { id: '123', name: 'Test Meal' };
    
    act(() => {
      const [, setMealplan] = result.current;
      setMealplan({ '2025-10-27': meal });
    });
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'mealplan_v1',
      expect.stringContaining('Test Meal')
    );
  });

  it('handles multiple meals on different dates', () => {
    const { result } = renderHook(() => useMealplan());
    const meal1 = { id: '123', name: 'Breakfast' };
    const meal2 = { id: '456', name: 'Dinner' };
    
    act(() => {
      const [, setMealplan] = result.current;
      setMealplan({ '2025-10-27': meal1, '2025-10-28': meal2 });
    });
    
    const [mealplan] = result.current;
    expect(mealplan['2025-10-27']).toEqual(meal1);
    expect(mealplan['2025-10-28']).toEqual(meal2);
  });

  it('overwrites meal on same date', () => {
    const { result } = renderHook(() => useMealplan());
    const meal1 = { id: '123', name: 'First Meal' };
    const meal2 = { id: '456', name: 'Second Meal' };
    
    act(() => {
      const [, setMealplan] = result.current;
      setMealplan({ '2025-10-27': meal1 });
    });
    
    let [mealplan] = result.current;
    expect(mealplan['2025-10-27']).toEqual(meal1);
    
    act(() => {
      const [, setMealplan] = result.current;
      setMealplan(prev => ({ ...prev, '2025-10-27': meal2 }));
    });
    
    [mealplan] = result.current;
    expect(mealplan['2025-10-27']).toEqual(meal2);
  });

  it('clears entire meal plan', () => {
    const { result } = renderHook(() => useMealplan());
    
    act(() => {
      const [, setMealplan] = result.current;
      setMealplan({ '2025-10-27': { id: '123', name: 'Meal 1' }, '2025-10-28': { id: '456', name: 'Meal 2' } });
    });
    
    let [mealplan] = result.current;
    expect(Object.keys(mealplan).length).toBe(2);
    
    act(() => {
      const [, setMealplan] = result.current;
      setMealplan({});
    });
    
    [mealplan] = result.current;
    expect(mealplan).toEqual({});
  });

  it('handles corrupted localStorage data gracefully', () => {
    localStorageMock.setItem('mealplan_v1', 'invalid json{');
    
    const { result } = renderHook(() => useMealplan());
    const [mealplan] = result.current;
    
    // Should fall back to empty meal plan instead of crashing
    expect(mealplan).toEqual({});
  });
});
