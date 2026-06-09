export type AgeGroup = 'junior' | 'middle' | 'senior';
export type PaymentChannel = 'mpesa_stk' | 'wallet_credit' | 'admin_grant';
export type ModerationDecision = 'allow' | 'hold_for_review' | 'block' | 'strike';

export function ageGroupFromAge(age: number): AgeGroup {
  if (age <= 10) return 'junior';
  if (age <= 14) return 'middle';
  return 'senior';
}

export function gamificationLabel(age: number) {
  const group = ageGroupFromAge(age);
  if (group === 'junior') return { balanceName: 'Stars', leaderboardLabel: 'Class stars', tone: 'encouraging' };
  if (group === 'middle') return { balanceName: 'Points', leaderboardLabel: 'Challenge board', tone: 'progressive' };
  return { balanceName: 'Credits', leaderboardLabel: 'Achievement ranking', tone: 'achievement' };
}

export function requireParentApproval(age: number, amountKes: number) {
  return age < 16 || amountKes > 0;
}

export function classifyModeration(severity: number, isChildFacing: boolean): ModerationDecision {
  if (severity >= 90) return 'strike';
  if (severity >= 70) return 'block';
  if (severity >= 35 || isChildFacing) return 'hold_for_review';
  return 'allow';
}

export function formatKes(value: number) {
  return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(value);
}
