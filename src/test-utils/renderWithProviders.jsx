import React from 'react';
import { render } from '@testing-library/react';
import { AuthContext } from '../context/AuthContext';
import { FilterProvider } from '../context/FilterContext';
import { MacroProvider } from '../context/MacroContext';
import { MealPlanProvider } from '../context/MealPlanContext';

const DEFAULT_AUTH = {
  user: null, loading: false,
  signInWithGoogle: jest.fn(), signInWithEmail: jest.fn(),
  signUpWithEmail: jest.fn(), signOut: jest.fn(),
};

export function renderWithProviders(ui, { authValue = DEFAULT_AUTH } = {}) {
  function Wrapper({ children }) {
    return (
      <AuthContext.Provider value={authValue}>
        <FilterProvider>
          <MacroProvider>
            <MealPlanProvider>
              {children}
            </MealPlanProvider>
          </MacroProvider>
        </FilterProvider>
      </AuthContext.Provider>
    );
  }
  return render(ui, { wrapper: Wrapper });
}
