'use client';
import React from 'react';
import { CalendarDays } from 'lucide-react';

function formatDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return new Date(+y, +m - 1, +d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function TimeframePicker({ startDate, endDate, onStartChange, onEndChange, disabled }) {
  return (
    <div className="timeframe-picker">
      <CalendarDays size={15} strokeWidth={1.75} className="timeframe-picker__icon" />
      <div className="timeframe-date-field">
        <span className="timeframe-date-label">From</span>
        <div className="timeframe-date-wrap">
          <span className="timeframe-date-value">{formatDate(startDate)}</span>
          <input
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
        <div className="timeframe-date-wrap">
          <span className="timeframe-date-value">{formatDate(endDate)}</span>
          <input
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
