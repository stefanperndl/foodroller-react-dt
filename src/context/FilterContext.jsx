'use client';
import { createContext, useContext, useState, useEffect } from 'react';

export const FilterContext = createContext(null);

export function FilterProvider({ children }) {
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedRestrictions, setSelectedRestrictions] = useState([]);

  useEffect(() => {
    fetch('https://www.themealdb.com/api/json/v1/1/categories.php')
      .then((res) => res.json())
      .then((data) => setCategories(data.categories || []));
  }, []);

  const toggleCategory = (cat) =>
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );

  const toggleRestriction = (restriction) =>
    setSelectedRestrictions((prev) =>
      prev.includes(restriction) ? prev.filter((r) => r !== restriction) : [...prev, restriction]
    );

  const clearCategories = () => setSelectedCategories([]);

  return (
    <FilterContext.Provider value={{
      categories,
      selectedCategories,
      selectedRestrictions,
      toggleCategory,
      toggleRestriction,
      clearCategories,
    }}>
      {children}
    </FilterContext.Provider>
  );
}

export const useFilterContext = () => useContext(FilterContext);
