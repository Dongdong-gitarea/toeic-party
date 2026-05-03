export interface ScoreResult {
  baseScore: number;
  speedBonus: number;
  comboMultiplier: number;
  total: number;
  newCombo: number;
}

const COMBO_TABLE = [1.0, 1.2, 1.5, 2.0];

function getComboMultiplier(combo: number): number {
  return COMBO_TABLE[Math.min(combo, COMBO_TABLE.length - 1)]!;
}

export function calculateCorrect(
  remainingTimeMs: number,
  currentCombo: number,
  isFinalQuestion: boolean,
): ScoreResult {
  const baseScore = 100;
  const speedBonus = Math.round((remainingTimeMs / 1000) * 8);
  const newCombo = currentCombo + 1;
  const comboMultiplier = getComboMultiplier(newCombo);

  let total = Math.round((baseScore + speedBonus) * comboMultiplier);
  if (isFinalQuestion) total = Math.round(total * 2.5);

  return { baseScore, speedBonus, comboMultiplier, total, newCombo };
}

export function calculateWrong(isFinalQuestion: boolean) {
  let penalty = -50;
  if (isFinalQuestion) penalty = Math.round(penalty * 2.5);
  return { total: penalty, newCombo: 0 };
}
