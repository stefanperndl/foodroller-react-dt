'use client';
import { useEffect } from 'react';

export default function ScrollUnlock() {
  useEffect(() => {
    const root = document.getElementById('root');
    if (!root) return;
    const prev = { overflow: root.style.overflow, height: root.style.height };
    root.style.overflow = 'auto';
    root.style.height = 'auto';
    return () => { root.style.overflow = prev.overflow; root.style.height = prev.height; };
  }, []);
  return null;
}
