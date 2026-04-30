'use client';
import { createContext, useContext, useState } from 'react';
import { useAuth } from './AuthContext';
import { useMacroProfile } from '../hooks/useMacroProfile';
import { useDietitianRole } from '../hooks/useDietitianRole';
import { useClients } from '../hooks/useClients';

export const MacroContext = createContext(null);

export function MacroProvider({ children }) {
  const { user } = useAuth();
  const [macroProfile, setMacroProfile] = useMacroProfile(user);
  const [isDietitian, claimDietitianRole] = useDietitianRole(user);
  const [clients, addClient, updateClient, deleteClient] = useClients(user, isDietitian);
  const [activeClient, setActiveClient] = useState(null);

  const effectiveMacroProfile = activeClient
    ? { kcal: activeClient.kcal, protein: activeClient.protein, carbs: activeClient.carbs, fat: activeClient.fat, goal: activeClient.goal }
    : macroProfile;

  return (
    <MacroContext.Provider value={{
      macroProfile, setMacroProfile,
      effectiveMacroProfile,
      isDietitian, claimDietitianRole,
      clients, addClient, updateClient, deleteClient,
      activeClient, setActiveClient,
    }}>
      {children}
    </MacroContext.Provider>
  );
}

export const useMacroContext = () => useContext(MacroContext);
