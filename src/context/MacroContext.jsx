'use client';
import { createContext, useContext, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import { useMacroProfile } from '../hooks/useMacroProfile';
import { useDietitianRole } from '../hooks/useDietitianRole';
import { useClients } from '../hooks/useClients';
import { useCustomRecipes } from '../hooks/useCustomRecipes';
import { useStockRecipes } from '../hooks/useStockRecipes';
import { useFavorites } from '../hooks/useFavorites';

export const MacroContext = createContext(null);

const STOCK_UID = process.env.NEXT_PUBLIC_STOCK_UID;

export function MacroProvider({ children }) {
  const { user } = useAuth();
  const [macroProfile, setMacroProfile] = useMacroProfile(user);
  const [isDietitian, claimDietitianRole] = useDietitianRole(user);
  const [clients, addClient, updateClient, deleteClient] = useClients(user, isDietitian);
  const [customRecipes, addRecipe, updateRecipe, deleteRecipe] = useCustomRecipes(user);
  const [stockRecipes, stockLoaded] = useStockRecipes(STOCK_UID);
  const { favorites, addFavorite, removeFavorite, isFavorite } = useFavorites(user);
  const [activeClient, setActiveClient] = useState(null);

  const allRecipes = useMemo(() => [...customRecipes, ...stockRecipes], [customRecipes, stockRecipes]);

  const effectiveMacroProfile = activeClient
    ? { kcal: activeClient.kcal, protein: activeClient.protein, carbs: activeClient.carbs, fat: activeClient.fat, goal: activeClient.goal }
    : macroProfile;

  return (
    <MacroContext.Provider value={{
      macroProfile, setMacroProfile,
      effectiveMacroProfile,
      isDietitian, claimDietitianRole,
      clients, addClient, updateClient, deleteClient,
      customRecipes, addRecipe, updateRecipe, deleteRecipe,
      stockRecipes, allRecipes,
      favorites, addFavorite, removeFavorite, isFavorite,
      stockLoaded,
      activeClient, setActiveClient,
    }}>
      {children}
    </MacroContext.Provider>
  );
}

export const useMacroContext = () => useContext(MacroContext);
