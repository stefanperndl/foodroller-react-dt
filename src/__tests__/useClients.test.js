import { renderHook, act, waitFor } from '@testing-library/react';
import { useClients } from '../hooks/useClients';
import { getDocs, addDoc, setDoc, deleteDoc } from 'firebase/firestore';

jest.mock('../lib/firebase', () => ({ db: {} }));
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc:        jest.fn(),
  getDocs:    jest.fn(),
  addDoc:     jest.fn(),
  setDoc:     jest.fn(),
  deleteDoc:  jest.fn(),
  serverTimestamp: jest.fn(() => 'SERVER_TS'),
}));

const user = { uid: 'user-abc' };

const mockDocs = (rows) => ({
  docs: rows.map((r) => ({ id: r.id, data: () => r })),
});

beforeEach(() => jest.clearAllMocks());

describe('useClients — no user or non-dietitian', () => {
  it('returns empty array when user is null', () => {
    const { result } = renderHook(() => useClients(null, false));
    expect(result.current[0]).toEqual([]);
    expect(getDocs).not.toHaveBeenCalled();
  });

  it('returns empty array when isDietitian is false', () => {
    const { result } = renderHook(() => useClients(user, false));
    expect(result.current[0]).toEqual([]);
    expect(getDocs).not.toHaveBeenCalled();
  });
});

describe('useClients — signed in dietitian', () => {
  it('loads clients from Firestore on mount', async () => {
    getDocs.mockResolvedValue(mockDocs([
      { id: 'c1', name: 'Alice', kcal: 2000, protein: 150, carbs: 200, fat: 70 },
    ]));
    const { result } = renderHook(() => useClients(user, true));
    await waitFor(() => expect(result.current[0]).toHaveLength(1));
    expect(result.current[0][0].name).toBe('Alice');
  });

  it('handles Firestore load error gracefully', async () => {
    getDocs.mockRejectedValue(new Error('network'));
    const { result } = renderHook(() => useClients(user, true));
    await waitFor(() => expect(getDocs).toHaveBeenCalled());
    expect(result.current[0]).toEqual([]);
  });

  it('addClient calls addDoc and appends to state', async () => {
    getDocs.mockResolvedValue(mockDocs([]));
    addDoc.mockResolvedValue({ id: 'new-id' });

    const { result } = renderHook(() => useClients(user, true));
    await waitFor(() => expect(getDocs).toHaveBeenCalled());

    const data = { name: 'Bob', kcal: 1800, protein: 130, carbs: 180, fat: 60, goal: 'lose', restrictions: [], notes: '' };
    await act(async () => { await result.current[1](data); });

    expect(addDoc).toHaveBeenCalled();
    expect(result.current[0]).toHaveLength(1);
    expect(result.current[0][0]).toMatchObject({ id: 'new-id', name: 'Bob' });
  });

  it('updateClient calls setDoc with merge and updates state', async () => {
    getDocs.mockResolvedValue(mockDocs([
      { id: 'c1', name: 'Alice', kcal: 2000, protein: 150, carbs: 200, fat: 70 },
    ]));
    setDoc.mockResolvedValue(undefined);

    const { result } = renderHook(() => useClients(user, true));
    await waitFor(() => expect(result.current[0]).toHaveLength(1));

    await act(async () => { await result.current[2]('c1', { kcal: 1900 }); });

    expect(setDoc).toHaveBeenCalled();
    expect(result.current[0][0].kcal).toBe(1900);
  });

  it('deleteClient calls deleteDoc and removes from state', async () => {
    getDocs.mockResolvedValue(mockDocs([
      { id: 'c1', name: 'Alice', kcal: 2000, protein: 150, carbs: 200, fat: 70 },
    ]));
    deleteDoc.mockResolvedValue(undefined);

    const { result } = renderHook(() => useClients(user, true));
    await waitFor(() => expect(result.current[0]).toHaveLength(1));

    await act(async () => { await result.current[3]('c1'); });

    expect(deleteDoc).toHaveBeenCalled();
    expect(result.current[0]).toHaveLength(0);
  });

  it('addClient is a no-op when user is null', async () => {
    const { result } = renderHook(() => useClients(null, true));
    await act(async () => { await result.current[1]({ name: 'Ghost' }); });
    expect(addDoc).not.toHaveBeenCalled();
  });
});
