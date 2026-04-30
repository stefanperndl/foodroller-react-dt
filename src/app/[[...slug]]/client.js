"use client";
import React from 'react';
import dynamic from 'next/dynamic';
import { AuthProvider } from '../../context/AuthContext';
import { FilterProvider } from '../../context/FilterContext';
import { MacroProvider } from '../../context/MacroContext';
import { MealPlanProvider } from '../../context/MealPlanContext';

const App = dynamic(() => import('../../App.jsx'));

export function ClientOnly() {
  return (
    <AuthProvider>
      <FilterProvider>
        <MacroProvider>
          <MealPlanProvider>
            <App />
          </MealPlanProvider>
        </MacroProvider>
      </FilterProvider>
    </AuthProvider>
  );
}
