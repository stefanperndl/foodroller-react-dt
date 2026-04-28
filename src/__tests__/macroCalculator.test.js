import { calculateMacros } from '../utils/macroCalculator';

const base = { sex: 'male', age: 30, weightKg: 80, heightCm: 180, activity: 'moderate' };

describe('calculateMacros', () => {
  it('returns values for all macro fields', () => {
    const result = calculateMacros({ ...base, goal: 'maintain' });
    expect(result).toMatchObject({
      kcal: expect.any(Number),
      protein: expect.any(Number),
      carbs: expect.any(Number),
      fat: expect.any(Number),
      goal: 'maintain',
    });
  });

  it('lose goal has lower kcal than maintain', () => {
    const lose     = calculateMacros({ ...base, goal: 'lose' });
    const maintain = calculateMacros({ ...base, goal: 'maintain' });
    expect(lose.kcal).toBeLessThan(maintain.kcal);
  });

  it('gain goal has higher kcal than maintain', () => {
    const gain     = calculateMacros({ ...base, goal: 'gain' });
    const maintain = calculateMacros({ ...base, goal: 'maintain' });
    expect(gain.kcal).toBeGreaterThan(maintain.kcal);
  });

  it('female BMR is lower than male for same inputs', () => {
    const male   = calculateMacros({ ...base, goal: 'maintain' });
    const female = calculateMacros({ ...base, sex: 'female', goal: 'maintain' });
    expect(female.kcal).toBeLessThan(male.kcal);
  });

  it('carbs are never negative', () => {
    const result = calculateMacros({ ...base, goal: 'lose' });
    expect(result.carbs).toBeGreaterThanOrEqual(0);
  });
});
