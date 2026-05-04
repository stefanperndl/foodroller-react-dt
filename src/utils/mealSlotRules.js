export const SLOT_CATEGORIES = {
  breakfast: ['Breakfast'],
  lunch:     null,  // null = use selectedCategories / all compatible
  dinner:    null,
  snack:     ['Dessert', 'Starter', 'Side', 'Miscellaneous'],
};

export const SLOT_MACRO_WEIGHTS = {
  breakfast: 0.25,
  lunch:     0.30,
  dinner:    0.35,
  snack:     0.10,
};

export function slotCategoryType(slotId) {
  if (slotId === 'breakfast') return 'breakfast';
  if (slotId === 'snack')     return 'snack';
  return 'main';
}

export function slotTargets(macroProfile, slotId) {
  const w = SLOT_MACRO_WEIGHTS[slotId] ?? 0.25;
  return {
    kcal:    Math.round(macroProfile.kcal    * w),
    protein: Math.round(macroProfile.protein * w),
    carbs:   Math.round(macroProfile.carbs   * w),
    fat:     Math.round(macroProfile.fat     * w),
  };
}
