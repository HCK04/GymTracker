// Single source of truth for personalized targets.
// Used by both the API (server) and surfaced to the UI via /api/preview.
// All values derive from the LIVE logged bodyweight so they grow as you do.

export function computeTargets({
  bodyweight = 58,
  height = 167,
  age = 25,
  goal = 'lean-bulk',
  trainingDay = true,
} = {}) {
  const kg = Number(bodyweight) || 58;
  const cm = Number(height) || 167;
  const yr = Number(age) || 25;

  // --- Water: 35 ml/kg, +600 ml on training days, rounded to 50 ml ---
  const baseWater = kg * 35;
  const waterMl = Math.round((baseWater + (trainingDay ? 600 : 0)) / 50) * 50;

  // --- Calories: Mifflin–St Jeor (male) × activity, ± goal ---
  const bmr = 10 * kg + 6.25 * cm - 5 * yr + 5;
  const tdee = bmr * 1.6; // 4 lifts + boxing => moderately/very active
  const factor = goal === 'lean-bulk' ? 1.12 : goal === 'cut' ? 0.85 : 1.0;
  const kcal = Math.round((tdee * factor) / 10) * 10;

  // --- Protein: 1.8 g/kg ---
  const protein = Math.round(kg * 1.8);

  return {
    waterMl,
    waterL: Math.round((waterMl / 1000) * 10) / 10,
    kcal,
    protein,
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
  };
}
