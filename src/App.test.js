import React from 'react';
import { render } from '@testing-library/react';
import App from './App';
import { AuthProvider } from './context/AuthContext';

jest.mock('./lib/firebase', () => ({ auth: {}, googleProvider: {}, db: {} }));
jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn((_auth, cb) => { cb(null); return jest.fn(); }),
  signInWithPopup: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
}));
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
}));

beforeAll(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ categories: [] }),
    })
  );
});

afterAll(() => {
  global.fetch.mockRestore && global.fetch.mockRestore();
});

describe('App', () => {
  it('renders without crashing', () => {
    render(<AuthProvider><App /></AuthProvider>);
  });
});
