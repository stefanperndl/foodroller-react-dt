import { useState, useEffect } from "react";

const MEALPLAN_KEY = "mealplan_v1";

export function useMealplan() {
  const [mealplan, setMealplan] = useState({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(MEALPLAN_KEY);
    if (stored) setMealplan(JSON.parse(stored));
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) {
      localStorage.setItem(MEALPLAN_KEY, JSON.stringify(mealplan));
    }
  }, [mealplan, loaded]);

  return [mealplan, setMealplan, loaded];
}