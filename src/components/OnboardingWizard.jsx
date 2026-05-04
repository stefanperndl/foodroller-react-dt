import React, { useState, useEffect } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useMacroContext } from '../context/MacroContext';
import { useFilterContext } from '../context/FilterContext';
import { useMealPlanContext } from '../context/MealPlanContext';
import { calculateMacros } from '../utils/macroCalculator';
import { generateMealPlan } from '../api/planner';
import { DEFAULT_SLOTS } from '../hooks/useMealSlots';

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

const RESTRICTIONS = [
  { key: 'vegetarian',  label: 'Vegetarian' },
  { key: 'vegan',       label: 'Vegan' },
  { key: 'pescatarian', label: 'Pescatarian' },
];

// 4 dots for meaningful steps 1-4; step 0 (auth) is a pre-step
const DOT_COUNT = 4;

function StepDots({ current }) {
  const dotIndex = current > 0 ? current - 1 : -1; // -1 = none active on step 0
  return (
    <div className="onboarding-step-dots">
      {Array.from({ length: DOT_COUNT }).map((_, i) => (
        <span key={i} className={`onboarding-step-dot${i === dotIndex ? ' active' : ''}`} />
      ))}
    </div>
  );
}

export default function OnboardingWizard({ onClose }) {
  const { user, signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const { setMacroProfile, effectiveMacroProfile } = useMacroContext();
  const { selectedRestrictions, toggleRestriction } = useFilterContext();
  const { setMealplan } = useMealPlanContext();

  const [currentStep, setCurrentStep] = useState(0);

  // Step 0
  const [authMode, setAuthMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Step 1
  const [goal, setGoal] = useState('');

  // Step 2
  const [bio, setBio] = useState({ sex: 'male', age: '', weightKg: '', heightCm: '', activity: 'moderate' });
  const [macros, setMacros] = useState(null);

  // Step 3
  const [restriction, setRestriction] = useState('');

  // Step 4
  const [genStatus, setGenStatus] = useState('idle');
  const [progress, setProgress] = useState('');

  useEffect(() => {
    if (user && currentStep === 0) setCurrentStep(1);
  }, [user, currentStep]);

  const handleSkip = () => onClose({ completedSteps: currentStep });

  const handleGoogleSignIn = async () => {
    setAuthError('');
    try {
      await signInWithGoogle();
    } catch (err) {
      setAuthError(err.message || 'Sign-in failed');
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      if (authMode === 'signin') {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password);
      }
    } catch (err) {
      setAuthError(err.message || 'Authentication failed');
    }
  };

  const handleCalculateMacros = () => {
    const result = calculateMacros({
      sex: bio.sex,
      age: Number(bio.age),
      weightKg: Number(bio.weightKg),
      heightCm: Number(bio.heightCm),
      activity: bio.activity,
      goal,
    });
    setMacros(result);
  };

  const handleTargetsNext = () => {
    if (macros) setMacroProfile(macros);
    setCurrentStep((s) => s + 1);
  };

  const handleDietNext = () => {
    [...selectedRestrictions].forEach((r) => toggleRestriction(r));
    if (restriction) toggleRestriction(restriction);

    const prefs = { restrictions: restriction ? [restriction] : [] };
    try { localStorage.setItem('user_preferences_v1', JSON.stringify(prefs)); } catch {}
    if (user) {
      setDoc(doc(db, 'users', user.uid, 'data', 'preferences'), prefs).catch(() => {});
    }

    setCurrentStep((s) => s + 1);
  };

  const handleGenerate = async () => {
    setGenStatus('generating');
    setProgress('Gathering recipes…');
    try {
      const today = new Date();
      const endDate = new Date(today);
      endDate.setDate(today.getDate() + 6);
      const plan = await generateMealPlan({
        startDate: today.toISOString().slice(0, 10),
        endDate: endDate.toISOString().slice(0, 10),
        macroProfile: effectiveMacroProfile,
        selectedCategories: [],
        selectedRestrictions: restriction ? [restriction] : [],
        slots: DEFAULT_SLOTS,
        onProgress: setProgress,
      });
      setMealplan((prev) => {
        const next = { ...prev };
        for (const [date, daySlots] of Object.entries(plan)) {
          next[date] = { ...(next[date] || {}), ...daySlots };
        }
        return next;
      });
      setGenStatus('done');
    } catch {
      setGenStatus('error');
    }
  };

  const macrosReady = macros && macros.kcal && macros.protein != null && macros.carbs != null && macros.fat != null;

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-card">
        <div className="onboarding-header">
          <StepDots current={currentStep} />
          <button className="onboarding-close-btn" onClick={handleSkip} aria-label="Close">×</button>
        </div>

        <div className="onboarding-body">
          {currentStep === 0 && (
            <div className="onboarding-step">
              <h2>Welcome to FoodRoller</h2>
              <p className="onboarding-subtitle">Sign in to sync your plan across devices, or continue as a guest.</p>

              <button className="onboarding-google-btn" onClick={handleGoogleSignIn}>
                Continue with Google
              </button>

              <div className="onboarding-auth-divider"><span>or</span></div>

              <form onSubmit={handleEmailAuth}>
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="onboarding-input"
                  required
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="onboarding-input"
                  required
                />
                {authError && <p className="onboarding-error">{authError}</p>}
                <button type="submit" className="onboarding-next-btn" style={{ width: '100%', marginTop: '4px' }}>
                  {authMode === 'signin' ? 'Sign in' : 'Create account'}
                </button>
              </form>

              <button
                className="onboarding-mode-toggle"
                onClick={() => { setAuthMode((m) => (m === 'signin' ? 'register' : 'signin')); setAuthError(''); }}
              >
                {authMode === 'signin' ? "Don't have an account? Register" : 'Already have an account? Sign in'}
              </button>

              <div className="onboarding-auth-divider" style={{ margin: '14px 0 6px' }}><span /></div>

              <button className="onboarding-guest-btn" onClick={() => setCurrentStep(1)}>
                Continue as guest →
              </button>
            </div>
          )}

          {currentStep === 1 && (
            <div className="onboarding-step">
              <h2>What's your goal?</h2>
              <p className="onboarding-subtitle">We'll use this to personalize your meal plan.</p>
              <div className="onboarding-goal-grid">
                {GOALS.map(({ key, label }) => (
                  <button
                    key={key}
                    className={`onboarding-goal-btn${goal === key ? ' active' : ''}`}
                    onClick={() => setGoal(key)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="onboarding-step">
              <h2>Set your targets</h2>
              <p className="onboarding-subtitle">We'll calculate your daily macros using Mifflin-St Jeor.</p>

              <div className="onboarding-sex-toggle">
                {['male', 'female'].map((s) => (
                  <button
                    key={s}
                    className={`onboarding-sex-btn${bio.sex === s ? ' active' : ''}`}
                    onClick={() => setBio((b) => ({ ...b, sex: s }))}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>

              <div className="onboarding-bio-fields">
                <label>
                  Age
                  <input
                    type="number" min="10" max="100"
                    value={bio.age}
                    onChange={(e) => setBio((b) => ({ ...b, age: e.target.value }))}
                    className="onboarding-input"
                    placeholder="years"
                  />
                </label>
                <label>
                  Weight
                  <input
                    type="number" min="30" max="300"
                    value={bio.weightKg}
                    onChange={(e) => setBio((b) => ({ ...b, weightKg: e.target.value }))}
                    className="onboarding-input"
                    placeholder="kg"
                  />
                </label>
                <label>
                  Height
                  <input
                    type="number" min="100" max="250"
                    value={bio.heightCm}
                    onChange={(e) => setBio((b) => ({ ...b, heightCm: e.target.value }))}
                    className="onboarding-input"
                    placeholder="cm"
                  />
                </label>
              </div>

              <label className="onboarding-activity-label">
                Activity level
                <select
                  value={bio.activity}
                  onChange={(e) => setBio((b) => ({ ...b, activity: e.target.value }))}
                  className="onboarding-input"
                >
                  {ACTIVITIES.map(({ key, label }) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </label>

              <button
                className="onboarding-calc-btn"
                onClick={handleCalculateMacros}
                disabled={!bio.age || !bio.weightKg || !bio.heightCm}
              >
                Calculate targets
              </button>

              {macros && (
                <div className="onboarding-macros-preview">
                  <span>{macros.kcal} kcal</span>
                  <span>{macros.protein}g protein</span>
                  <span>{macros.carbs}g carbs</span>
                  <span>{macros.fat}g fat</span>
                </div>
              )}
            </div>
          )}

          {currentStep === 3 && (
            <div className="onboarding-step">
              <h2>Any dietary restrictions?</h2>
              <p className="onboarding-subtitle">We'll only suggest meals that fit your diet.</p>
              <div className="onboarding-restriction-grid">
                <button
                  className={`onboarding-restriction-btn${!restriction ? ' active' : ''}`}
                  onClick={() => setRestriction('')}
                >
                  None
                </button>
                {RESTRICTIONS.map(({ key, label }) => (
                  <button
                    key={key}
                    className={`onboarding-restriction-btn${restriction === key ? ' active' : ''}`}
                    onClick={() => setRestriction((prev) => (prev === key ? '' : key))}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="onboarding-step">
              {genStatus !== 'done' && (
                <>
                  <h2>Generate your first week</h2>
                  <p className="onboarding-subtitle">Let AI build a meal plan tailored to your goals.</p>
                </>
              )}

              {genStatus === 'idle' && (
                <button className="onboarding-next-btn onboarding-generate-btn" onClick={handleGenerate}>
                  Generate my first week
                </button>
              )}

              {genStatus === 'generating' && (
                <div className="onboarding-generating">
                  <div className="planner-spinner" />
                  <p className="onboarding-progress">{progress}</p>
                </div>
              )}

              {genStatus === 'done' && (
                <div className="onboarding-success">
                  <p className="onboarding-success-title">Your first week is ready</p>
                  <p className="onboarding-success-sub">Meals have been added to your plan.</p>
                </div>
              )}

              {genStatus === 'error' && (
                <div className="onboarding-gen-error">
                  <p>Something went wrong. Please try again.</p>
                  <button className="onboarding-calc-btn" onClick={handleGenerate}>Try again</button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="onboarding-footer">
          {currentStep > 0 && currentStep < 4 && (
            <button className="onboarding-skip-btn" onClick={handleSkip}>Skip for now</button>
          )}
          {currentStep === 4 && genStatus === 'idle' && (
            <button className="onboarding-skip-btn" onClick={handleSkip}>Skip — I'll do this later</button>
          )}
          {(currentStep === 0 || (currentStep === 4 && (genStatus === 'generating' || genStatus === 'error'))) && (
            <span />
          )}

          {currentStep === 1 && (
            <button className="onboarding-next-btn" onClick={() => setCurrentStep((s) => s + 1)} disabled={!goal}>
              Next →
            </button>
          )}
          {currentStep === 2 && (
            <button className="onboarding-next-btn" onClick={handleTargetsNext} disabled={!macrosReady}>
              Next →
            </button>
          )}
          {currentStep === 3 && (
            <button className="onboarding-next-btn" onClick={handleDietNext}>
              Next →
            </button>
          )}
          {currentStep === 4 && genStatus === 'done' && (
            <button className="onboarding-next-btn" onClick={() => onClose({ completedSteps: 5 })}>
              Go to my plan →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
