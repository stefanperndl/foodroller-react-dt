import "../App.css";

export function TimeframePicker({
  startDate,
  endDate,
  onStartChange,
  onEndChange,
  disabled,
}) {
  return (
    <div className="timeframe-picker">
      <label>
        Start date:{" "}
        <input
          type="date"
          value={startDate}
          onChange={(e) => onStartChange(e.target.value)}
          max={endDate}
          disabled={disabled}
        />
      </label>
      <label>
        End date:{" "}
        <input
          type="date"
          value={endDate}
          onChange={(e) => onEndChange(e.target.value)}
          min={startDate}
          disabled={disabled}
        />
      </label>
    </div>
  );
}
