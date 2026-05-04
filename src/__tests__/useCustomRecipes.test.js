import { renderHook, act, waitFor } from '@testing-library/react';
import { useCustomRecipes } from '../hooks/useCustomRecipes';

jest.mock('../lib/firebase', () => ({ db: {} }));

const mockAddDoc = jest.fn();
const mockSetDoc = jest.fn();
const mockDeleteDoc = jest.fn();
const mockGetDocs = jest.fn();
const mockServerTimestamp = jest.fn(() => 'TS');
const mockCollection = jest.fn();
const mockDoc = jest.fn();

jest.mock('firebase/firestore', () => ({
  collection: (...args) => mockCollection(...args),
  doc: (...args) => mockDoc(...args),
  getDocs: (...args) => mockGetDocs(...args),
  addDoc: (...args) => mockAddDoc(...args),
  setDoc: (...args) => mockSetDoc(...args),
  deleteDoc: (...args) => mockDeleteDoc(...args),
  serverTimestamp: () => mockServerTimestamp(),
}));

jest.mock('../api/nutrition', () => ({
  getNutrition: jest.fn(() =>
    Promise.resolve({ kcal: 400, protein: 30, carbs: 40, fat: 10, fiber: 5 })
  ),
  getNutritionFromCache: jest.fn(() => null),
  DEFAULT_SERVINGS: 4,
}));

const { getNutrition } = require('../api/nutrition');

const fakeUser = { uid: 'user-1' };
const fakeRecipe = {
  name: 'My Chili',
  category: 'Beef',
  ingredients: ['500g beef', '2 cans beans'],
  instructions: 'Cook it.',
  source: 'custom',
  forkedFrom: null,
  tags: [],
  servings: 4,
  image: '',
  published: false,
};

beforeEach(() => {
  jest.clearAllMocks();
  mockGetDocs.mockResolvedValue({ docs: [] });
  mockAddDoc.mockResolvedValue({ id: 'new-id' });
  mockSetDoc.mockResolvedValue();
  mockDeleteDoc.mockResolvedValue();
});

describe('useCustomRecipes', () => {
  it('returns empty array when user is null', () => {
    const { result } = renderHook(() => useCustomRecipes(null));
    expect(result.current[0]).toEqual([]);
  });

  it('loads recipes from Firestore on mount', async () => {
    mockGetDocs.mockResolvedValueOnce({
      docs: [{ id: 'r1', data: () => ({ name: 'Pasta', category: 'Italian' }) }],
    });
    const { result } = renderHook(() => useCustomRecipes(fakeUser));
    await waitFor(() => expect(result.current[0]).toHaveLength(1));
    expect(result.current[0]).toEqual([{ id: 'r1', name: 'Pasta', category: 'Italian' }]);
  });

  it('clears recipes when user becomes null', async () => {
    mockGetDocs.mockResolvedValueOnce({
      docs: [{ id: 'r1', data: () => ({ name: 'Pasta' }) }],
    });
    const { result, rerender } = renderHook(({ user }) => useCustomRecipes(user), {
      initialProps: { user: fakeUser },
    });
    await waitFor(() => expect(result.current[0]).toHaveLength(1));

    rerender({ user: null });
    expect(result.current[0]).toEqual([]);
  });

  it('addRecipe fetches nutrition, calls addDoc, updates state, writes to shared cache', async () => {
    const { result } = renderHook(() => useCustomRecipes(fakeUser));
    await waitFor(() => expect(mockGetDocs).toHaveBeenCalled());

    let saved;
    await act(async () => {
      saved = await result.current[1](fakeRecipe);
    });

    expect(getNutrition).toHaveBeenCalledWith(null, fakeRecipe.ingredients);
    expect(mockAddDoc).toHaveBeenCalledTimes(1);
    expect(result.current[0]).toHaveLength(1);
    expect(result.current[0][0].id).toBe('new-id');
    expect(result.current[0][0].nutrition).toEqual({
      kcal: 400, protein: 30, carbs: 40, fat: 10, fiber: 5,
    });
    expect(mockSetDoc).toHaveBeenCalledTimes(1);
    expect(saved.id).toBe('new-id');
  });

  it('addRecipe uses forkedFrom as cache key when forking', async () => {
    const { result } = renderHook(() => useCustomRecipes(fakeUser));
    await waitFor(() => expect(mockGetDocs).toHaveBeenCalled());

    await act(async () => {
      await result.current[1]({ ...fakeRecipe, source: 'fork', forkedFrom: 'mealdb-123' });
    });

    expect(getNutrition).toHaveBeenCalledWith('mealdb-123', fakeRecipe.ingredients);
  });

  it('addRecipe saves with nutrition: null when CalorieNinjas fails', async () => {
    getNutrition.mockRejectedValueOnce(new Error('API down'));
    const { result } = renderHook(() => useCustomRecipes(fakeUser));
    await waitFor(() => expect(mockGetDocs).toHaveBeenCalled());

    await act(async () => {
      await result.current[1](fakeRecipe);
    });

    expect(result.current[0][0].nutrition).toBeNull();
  });

  it('updateRecipe calls setDoc with merge:true and updates state', async () => {
    mockGetDocs.mockResolvedValueOnce({
      docs: [{ id: 'r1', data: () => ({ ...fakeRecipe }) }],
    });
    const { result } = renderHook(() => useCustomRecipes(fakeUser));
    await waitFor(() => expect(result.current[0]).toHaveLength(1));

    await act(async () => {
      await result.current[2]('r1', { ...fakeRecipe, name: 'Updated Chili' });
    });

    expect(mockSetDoc).toHaveBeenCalled();
    expect(result.current[0][0].name).toBe('Updated Chili');
  });

  it('deleteRecipe calls deleteDoc and removes from state', async () => {
    mockGetDocs.mockResolvedValueOnce({
      docs: [{ id: 'r1', data: () => ({ name: 'To Delete' }) }],
    });
    const { result } = renderHook(() => useCustomRecipes(fakeUser));
    await waitFor(() => expect(result.current[0]).toHaveLength(1));

    await act(async () => {
      await result.current[3]('r1');
    });

    expect(mockDeleteDoc).toHaveBeenCalledTimes(1);
    expect(result.current[0]).toHaveLength(0);
  });

  it('gracefully ignores Firestore errors on load', async () => {
    mockGetDocs.mockRejectedValueOnce(new Error('permission denied'));
    const { result } = renderHook(() => useCustomRecipes(fakeUser));
    await waitFor(() => expect(mockGetDocs).toHaveBeenCalled());
    expect(result.current[0]).toEqual([]);
  });
});
