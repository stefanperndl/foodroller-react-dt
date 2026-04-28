"use client";
import React from 'react';
import dynamic from 'next/dynamic';
import { AuthProvider } from '../../context/AuthContext';

const App = dynamic(() => import('../../App.jsx'));

export function ClientOnly() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}
