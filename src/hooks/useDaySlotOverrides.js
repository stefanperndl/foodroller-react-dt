import { useState, useEffect } from 'react';

const STORAGE_KEY = 'dayslot_overrides_v1';

export function useDaySlotOverrides() {
  const [overrides, setOverrides] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
    } catch {}
  }, [overrides]);

  return [overrides, setOverrides];
}
