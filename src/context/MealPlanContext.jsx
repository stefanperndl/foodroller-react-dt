'use client';
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { useFilterContext } from './FilterContext';
import { useMacroContext } from './MacroContext';
import { useMealplan } from '../hooks/useMealplan';
import { useMealSlots } from '../hooks/useMealSlots';
import { useDaySlotOverrides } from '../hooks/useDaySlotOverrides';
import { getNutrition, getNutritionFromCache } from '../api/nutrition';
import { swapMeal } from '../api/planner';
import { fetchMealById } from '../api/recipes';

export const MealPlanContext = createContext(null);

export function MealPlanProvider({ children }) {
  const { user } = useAuth();
  const { selectedCategories, selectedRestrictions } = useFilterContext();
  const { effectiveMacroProfile, customRecipes } = useMacroContext();

  const [mealplan, setMealplan] = useMealplan(user);
  const [slots, setSlots] = useMealSlots(user);
  const [daySlotOverrides, setDaySlotOverrides] = useDaySlotOverrides();
  const [slotFilters, setSlotFilters] = useState({});
  const [nutritionMap, setNutritionMap] = useState({});
  const [rerollingKey, setRerollingKey] = useState(null);
  const [swapDelta, setSwapDelta] = useState(null);

  useEffect(() => {
    const meals = [];
    for (const day of Object.values(mealplan)) {
      for (const meal of Object.values(day)) {
        if (meal?.ingredients?.length) meals.push(meal);
      }
    }
    const uncached = meals.filter((m) => {
      const k = m.id ?? m.name;
      return k && !getNutritionFromCache(k) && !nutritionMap[k];
    });
    if (!uncached.length) return;
    let cancelled = false;
    Promise.all(
      uncached.map((m) =>
        getNutrition(m.id ?? m.name, m.ingredients)
          .then((n) => ({ key: m.id ?? m.name, n }))
          .catch(() => null)
      )
    ).then((results) => {
      if (cancelled) return;
      const map = {};
      results.forEach((r) => { if (r) map[r.key] = r.n; });
      if (Object.keys(map).length) setNutritionMap((prev) => ({ ...prev, ...map }));
    });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mealplan]);

  const getDaySlots = useCallback(
    (date) => [...(daySlotOverrides[date] ?? slots)].sort((a, b) => a.order - b.order),
    [daySlotOverrides, slots]
  );

  const handleAddSlotToDay = useCallback((date, slot) => {
    setDaySlotOverrides((prev) => {
      const current = prev[date] ?? slots;
      if (current.some((s) => s.id === slot.id)) return prev;
      return { ...prev, [date]: [...current, slot].sort((a, b) => a.order - b.order) };
    });
  }, [setDaySlotOverrides, slots]);

  const handleRemoveSlotFromDay = useCallback((date, slotId) => {
    setDaySlotOverrides((prev) => {
      const current = prev[date] ?? slots;
      return { ...prev, [date]: current.filter((s) => s.id !== slotId) };
    });
    setMealplan((prev) => {
      const day = { ...(prev[date] || {}) };
      delete day[slotId];
      const next = { ...prev };
      if (Object.keys(day).length === 0) delete next[date];
      else next[date] = day;
      return next;
    });
  }, [setDaySlotOverrides, setMealplan, slots]);

  const handleRemoveMeal = useCallback((date, slotId) => {
    setMealplan((prev) => {
      const day = { ...(prev[date] || {}) };
      delete day[slotId];
      const next = { ...prev };
      if (Object.keys(day).length === 0) delete next[date];
      else next[date] = day;
      return next;
    });
  }, [setMealplan]);

  const handleReroll = useCallback(async (date, slotId) => {
    const key = `${date}-${slotId}`;
    const sf = slotFilters[slotId];
    const cats  = sf?.categories?.length  ? sf.categories  : selectedCategories;
    const restr = sf?.restrictions?.length ? sf.restrictions : selectedRestrictions;
    setRerollingKey(key);
    try {
      const { meal, delta } = await swapMeal({
        date, slotId,
        currentPlan: mealplan,
        macroProfile: effectiveMacroProfile,
        selectedRestrictions: restr,
        selectedCategories: cats,
        customRecipes,
      });
      const fullMeal = meal.ingredients ? meal : await fetchMealById(meal.id);
      setMealplan((prev) => ({
        ...prev,
        [date]: { ...(prev[date] || {}), [slotId]: fullMeal },
      }));
      if (delta) {
        setSwapDelta({ date, slotId, delta });
        setTimeout(() => setSwapDelta(null), 4000);
      }
    } catch (err) {
      console.error('Reroll failed:', err);
    } finally {
      setRerollingKey(null);
    }
  }, [mealplan, slotFilters, selectedCategories, selectedRestrictions, effectiveMacroProfile, customRecipes, setMealplan]);

  const handleSlotFilterChange = useCallback((slotId, filters) => {
    setSlotFilters((prev) => ({ ...prev, [slotId]: filters }));
  }, []);

  const getIngredientsByRecipe = useCallback(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const result = {};
    for (const [date, daySlots] of Object.entries(mealplan)) {
      if (new Date(date) < todayStart) continue;
      for (const [slotId, meal] of Object.entries(daySlots)) {
        if (meal?.ingredients?.length) {
          result[`${date}-${slotId}`] = { name: meal.name, ingredients: meal.ingredients };
        }
      }
    }
    return result;
  }, [mealplan]);

  const cartCount = useMemo(
    () => Object.values(mealplan).reduce(
      (n, day) => n + Object.values(day).filter((m) => m?.ingredients?.length).length,
      0
    ),
    [mealplan]
  );

  return (
    <MealPlanContext.Provider value={{
      mealplan, setMealplan,
      slots, setSlots,
      daySlotOverrides,
      slotFilters,
      nutritionMap,
      rerollingKey,
      swapDelta,
      getDaySlots,
      cartCount,
      getIngredientsByRecipe,
      handleReroll,
      handleRemoveMeal,
      handleAddSlotToDay,
      handleRemoveSlotFromDay,
      handleSlotFilterChange,
    }}>
      {children}
    </MealPlanContext.Provider>
  );
}

export const useMealPlanContext = () => useContext(MealPlanContext);
