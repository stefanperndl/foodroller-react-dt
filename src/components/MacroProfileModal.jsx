'use client';
import { useState } from 'react';
import { calculateMacros } from '../utils/macroCalculator';
import { useMacroContext } from '../context/MacroContext';

const GOALS = [
  { key: 'lose',     label: 'Lose weight' },
  { key: 'maintain', label: 'Maintain' },
  { key: 'gain',     label: 'Gain muscle' },
];

const ACTIVITIES = [
  { key: 'sedentary',   label: 'Sedentary (desk job, no exercise)' },
  { key: 'light',       label: 'Light (1–3 days/week)' },
  { key: 'moderate',    label: 'Moderate (3–5 days/week)' },
  { key: 'active',      label: 'Active (6–7 days/week)' },
  { key: 'very_active', label: 'Very active (athlete / physical job)' },
];

export default function MacroProfileModal({ onClose }) {
  const { macroProfile, setMacroProfile } = useMacroContext();
  const [goal, setGoal]         = useState(macroProfile?.goal ?? 'lose');
  const [sex, setSex]           = useState('male');
  const [age, setAge]           = useState('');
  const [weight, setWeight]     = useState('');
  const [height, setHeight]     = useState('');
  const [activity, setActivity] = useState('moderate');

  const [kcal,    setKcal]    = useState(macroProfile?.kcal    ?? '');
  const [protein, setProtein] = useState(macroProfile?.protein ?? '');
  const [carbs,   setCarbs]   = useState(macroProfile?.carbs   ?? '');
  const [fat,     setFat]     = useState(macroProfile?.fat     ?? '');

  function handleCalculate() {
    if (!age || !weight || !height) return;
    const result = calculateMacros({
      sex, age: Number(age), weightKg: Number(weight),
      heightCm: Number(height), activity, goal,
    });
    setKcal(result.kcal);
    setProtein(result.protein);
    setCarbs(result.carbs);
    setFat(result.fat);
  }

  function handleSave(e) {
    e.preventDefault();
    if (!kcal || !protein || !carbs || !fat) return;
    setMacroProfile({ kcal: Number(kcal), protein: Number(protein), carbs: Number(carbs), fat: Number(fat), goal });
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content macro-profile-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close">×</button>
        <h2 className="macro-profile-title">Set your nutrition goals</h2>

        <div className="macro-goal-tabs">
          {GOALS.map((g) => (
            <button
              key={g.key}
              className={`macro-goal-tab ${goal === g.key ? 'active' : ''}`}
              onClick={() => setGoal(g.key)}
              type="button"
            >
              {g.label}
            </button>
          ))}
        </div>

        <div className="macro-calculator">
          <div className="macro-calc-row">
            <div className="macro-calc-field">
              <label>Sex</label>
              <div className="macro-sex-toggle">
                <button type="button" className={sex === 'male'   ? 'active' : ''} onClick={() => setSex('male')}>Male</button>
                <button type="button" className={sex === 'female' ? 'active' : ''} onClick={() => setSex('female')}>Female</button>
              </div>
            </div>
            <div className="macro-calc-field">
              <label htmlFor="mp-age">Age</label>
              <input id="mp-age" type="number" min="10" max="100" placeholder="30" value={age} onChange={(e) => setAge(e.target.value)} className="macro-calc-input" />
            </div>
          </div>
          <div className="macro-calc-row">
            <div className="macro-calc-field">
              <label htmlFor="mp-weight">Weight (kg)</label>
              <input id="mp-weight" type="number" min="30" max="300" placeholder="75" value={weight} onChange={(e) => setWeight(e.target.value)} className="macro-calc-input" />
            </div>
            <div className="macro-calc-field">
              <label htmlFor="mp-height">Height (cm)</label>
              <input id="mp-height" type="number" min="100" max="250" placeholder="175" value={height} onChange={(e) => setHeight(e.target.value)} className="macro-calc-input" />
            </div>
          </div>
          <div className="macro-calc-field macro-calc-full">
            <label htmlFor="mp-activity">Activity level</label>
            <select id="mp-activity" value={activity} onChange={(e) => setActivity(e.target.value)} className="macro-calc-input">
              {ACTIVITIES.map((a) => <option key={a.key} value={a.key}>{a.label}</option>)}
            </select>
          </div>
          <button type="button" className="macro-calc-btn" onClick={handleCalculate}>
            Calculate targets
          </button>
        </div>

        <form onSubmit={handleSave} className="macro-targets-form">
          <p className="macro-targets-hint">Adjust the calculated values or enter manually:</p>
          <div className="macro-targets-grid">
            <div className="macro-target-field">
              <label htmlFor="mp-kcal">kcal / day</label>
              <input id="mp-kcal" type="number" min="800" max="6000" value={kcal} onChange={(e) => setKcal(e.target.value)} className="macro-calc-input" required />
            </div>
            <div className="macro-target-field">
              <label htmlFor="mp-protein">Protein (g)</label>
              <input id="mp-protein" type="number" min="0" max="500" value={protein} onChange={(e) => setProtein(e.target.value)} className="macro-calc-input" required />
            </div>
            <div className="macro-target-field">
              <label htmlFor="mp-carbs">Carbs (g)</label>
              <input id="mp-carbs" type="number" min="0" max="1000" value={carbs} onChange={(e) => setCarbs(e.target.value)} className="macro-calc-input" required />
            </div>
            <div className="macro-target-field">
              <label htmlFor="mp-fat">Fat (g)</label>
              <input id="mp-fat" type="number" min="0" max="300" value={fat} onChange={(e) => setFat(e.target.value)} className="macro-calc-input" required />
            </div>
          </div>
          <button type="submit" className="macro-save-btn">Save goals</button>
        </form>
      </div>
    </div>
  );
}
