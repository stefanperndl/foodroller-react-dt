import { renderHook, waitFor } from '@testing-library/react';
import { useStockRecipes } from '../hooks/useStockRecipes';

jest.mock('../lib/firebase', () => ({ db: {} }));

const mockGetDocs = jest.fn();
const mockCollection = jest.fn();

jest.mock('firebase/firestore', () => ({
  collection: (...args) => mockCollection(...args),
  getDocs: (...args) => mockGetDocs(...args),
}));

beforeEach(() => {
  mockGetDocs.mockReset();
  mockCollection.mockReset();
});

describe('useStockRecipes', () => {
  it('returns empty when no stockUid', () => {
    const { result } = renderHook(() => useStockRecipes(undefined));
    expect(result.current[0]).toEqual([]);
    expect(mockGetDocs).not.toHaveBeenCalled();
  });

  it('fetches recipes from users/{stockUid}/recipes and tags isStock', async () => {
    mockGetDocs.mockResolvedValueOnce({
      docs: [
        { id: 'r1', data: () => ({ name: 'Schnitzel', category: 'Beef' }) },
        { id: 'r2', data: () => ({ name: 'Pasta', category: 'Pasta' }) },
      ],
    });
    const { result } = renderHook(() => useStockRecipes('stock-uid'));
    await waitFor(() => expect(result.current[0].length).toBe(2));
    expect(result.current[0][0]).toEqual({
      id: 'r1', name: 'Schnitzel', category: 'Beef',
      isStock: true, ownerUid: 'stock-uid',
    });
    expect(mockCollection).toHaveBeenCalledWith({}, 'users', 'stock-uid', 'recipes');
  });

  it('swallows errors and returns []', async () => {
    mockGetDocs.mockRejectedValueOnce(new Error('permission denied'));
    const { result } = renderHook(() => useStockRecipes('stock-uid'));
    await waitFor(() => expect(mockGetDocs).toHaveBeenCalled());
    expect(result.current[0]).toEqual([]);
  });
});
