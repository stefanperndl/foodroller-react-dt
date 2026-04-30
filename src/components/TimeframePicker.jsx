'use client';
import React, { useRef } from 'react';
import { CalendarDays } from 'lucide-react';

function formatDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return new Date(+y, +m - 1, +d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function TimeframePicker({ startDate, endDate, onStartChange, onEndChange, disabled }) {
  const startRef = useRef(null);
  const endRef = useRef(null);

  return (
    <div className="timeframe-picker">
      <CalendarDays size={15} strokeWidth={1.75} className="timeframe-picker__icon" />
      <div className="timeframe-date-field">
        <span className="timeframe-date-label">From</span>
        <div className="timeframe-date-wrap" onClick={() => startRef.current?.showPicker()}>
          <span className="timeframe-date-value">{formatDate(startDate)}</span>
          <input
            ref={startRef}
            type="date"
            value={startDate}
            onChange={(e) => onStartChange(e.target.value)}
            max={endDate}
            disabled={disabled}
            className="timeframe-date-input"
            aria-label="Start date"
          />
        </div>
      </div>
      <span className="timeframe-sep">→</span>
      <div className="timeframe-date-field">
        <span className="timeframe-date-label">To</span>
        <div className="timeframe-date-wrap" onClick={() => endRef.current?.showPicker()}>
          <span className="timeframe-date-value">{formatDate(endDate)}</span>
          <input
            ref={endRef}
            type="date"
            value={endDate}
            onChange={(e) => onEndChange(e.target.value)}
            min={startDate}
            disabled={disabled}
            className="timeframe-date-input"
            aria-label="End date"
          />
        </div>
      </div>
    </div>
  );
}
