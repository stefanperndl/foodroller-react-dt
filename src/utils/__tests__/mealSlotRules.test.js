import { slotCategoryType, slotTargets, SLOT_CATEGORIES } from '../mealSlotRules';

describe('slotCategoryType', () => {
  it('returns breakfast for breakfast slot', () => expect(slotCategoryType('breakfast')).toBe('breakfast'));
  it('returns snack for snack slot', () => expect(slotCategoryType('snack')).toBe('snack'));
  it('returns main for lunch', () => expect(slotCategoryType('lunch')).toBe('main'));
  it('returns main for dinner', () => expect(slotCategoryType('dinner')).toBe('main'));
  it('returns main for unknown custom slot', () => expect(slotCategoryType('slot-123')).toBe('main'));
});

describe('SLOT_CATEGORIES', () => {
  it('breakfast maps to Breakfast category', () => expect(SLOT_CATEGORIES.breakfast).toEqual(['Breakfast']));
  it('lunch is null (use all categories)', () => expect(SLOT_CATEGORIES.lunch).toBeNull());
  it('dinner is null', () => expect(SLOT_CATEGORIES.dinner).toBeNull());
  it('snack maps to dessert/light categories', () =>
    expect(SLOT_CATEGORIES.snack).toEqual(expect.arrayContaining(['Dessert', 'Starter'])));
});

describe('slotTargets', () => {
  const profile = { kcal: 2000, protein: 150, carbs: 200, fat: 70 };

  it('breakfast = 25% of daily targets', () => {
    const t = slotTargets(profile, 'breakfast');
    expect(t.kcal).toBe(500);
    expect(t.protein).toBe(38);
  });

  it('lunch = 30%', () => {
    const t = slotTargets(profile, 'lunch');
    expect(t.kcal).toBe(600);
  });

  it('dinner = 35%', () => {
    const t = slotTargets(profile, 'dinner');
    expect(t.kcal).toBe(700);
  });

  it('snack = 10%', () => {
    const t = slotTargets(profile, 'snack');
    expect(t.kcal).toBe(200);
  });

  it('unknown slot defaults to 25%', () => {
    const t = slotTargets(profile, 'unknown');
    expect(t.kcal).toBe(500);
  });
});
