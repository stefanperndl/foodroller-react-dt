const ACTIVITY_FACTORS = {
  sedentary:  1.2,
  light:      1.375,
  moderate:   1.55,
  active:     1.725,
  very_active: 1.9,
};

export function calculateMacros({ sex, age, weightKg, heightCm, activity, goal }) {
  // Mifflin-St Jeor BMR
  const bmr =
    sex === 'male'
      ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
      : 10 * weightKg + 6.25 * heightCm - 5 * age - 161;

  const tdee = bmr * (ACTIVITY_FACTORS[activity] ?? 1.55);

  const kcal =
    goal === 'lose'  ? Math.round(tdee - 500) :
    goal === 'gain'  ? Math.round(tdee + 300) :
                       Math.round(tdee);

  // Protein: 2g/kg for lose/gain, 1.6g/kg for maintain
  const protein = Math.round(goal === 'maintain' ? weightKg * 1.6 : weightKg * 2);
  const fat     = Math.round((kcal * 0.25) / 9);
  const carbs   = Math.round((kcal - protein * 4 - fat * 9) / 4);

  return { kcal, protein, carbs: Math.max(carbs, 0), fat, goal };
}
