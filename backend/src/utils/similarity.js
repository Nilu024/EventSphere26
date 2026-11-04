/** Pure, dependency-free matching maths (unit-tested). */
export const WEIGHTS = Object.freeze({ skills: 0.6, interests: 0.4 });

export const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

/** Jaccard similarity as a percentage (0-100). Two empty sets -> 0. */
export function jaccardPercent(a = [], b = []) {
  const A = new Set(a);
  const B = new Set(b);
  if (A.size === 0 && B.size === 0) return 0;
  let inter = 0;
  for (const x of A) if (B.has(x)) inter += 1;
  const union = A.size + B.size - inter;
  return union === 0 ? 0 : (inter / union) * 100;
}

/** S = 0.60 * K + 0.40 * I  (K = skill similarity %, I = interest similarity %) */
export const weightedScore = (skillSimilarity, interestSimilarity) =>
  WEIGHTS.skills * skillSimilarity + WEIGHTS.interests * interestSimilarity;

/** Attended / registered * 100, safe for zero registrations. */
export const attendancePercentage = (attended, registered) =>
  registered > 0 ? round2((attended / registered) * 100) : 0;
