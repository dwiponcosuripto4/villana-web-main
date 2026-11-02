/**
 * Normalize Rating (R) using Bayesian Average
 * Formula:
 * R = (C * m + n * r) / (C + n)
 */
export function normalizeRating(rating: number, ratingCount: number): number {
  const a = (50 * 4.5 + ratingCount * rating) / (50 + ratingCount);
  return a;
}

// // Example usage:
// const F = 0.75;      // Facility score
// const R = 4.65;       // Normalized rating
// const P = 874;      // Price
// const priceSensv = 2; // Price sensitivity
//
// const pv = calcPVR(F, R, P, priceSensv);
// console.log(`Price-to-Value Ratio (PV): ${pv.toFixed(3)}`);
// console.log(`PVR 2: ${calcPVR(0.833, 4.9, 1350, priceSensv)}`)

export interface FacilityScoreParams {
  breakfast?: number; // 1-2
  bathtub?: number; // 1
  pool?: number; // 1-3
  resto?: number; // 1-2
  view?: number; // 1-3
  tv?: number; // 1
  ac?: number; // 1
  wifi?: number; // 1
  parking?: number; // 1
  kitchen?: number; // 1-2
  bedrooms?: number; // 1-3
  entertainment?: number; // 1-3
  access?: number; // 1
  syariah?: number; // 0
  gym?: number; // 1-2
  // --- belum dimasukkan dalam max facility score ---
  welcomeComplimentary?: number; // 0-1
  equipmentComplimentary?: number; // 0-3
  meetingRoom?: number; // 0-2
  playground?: number; // 0-1
}

export const MAX_FACILITY_SCORE = 26;
const PRICE_SENSITIVITY = 1.65;

/**
 * Calculate Facility Score (F)
 * Formula:
 * F = (Sum of facility weights) / (Maximum possible score)
 * @param vars - Object containing facility parameters
 * @returns Facility score (0–1)
 */
export function calcFacilityScore(vars: FacilityScoreParams): number {
  const sum = Object.values(vars).reduce((acc, val) => acc + (val || 0), 0);

  const rv = sum / MAX_FACILITY_SCORE;

  return rv;
}

/**
 * Calculate Price-to-Value Ratio (PV)
 *
 * Formula:
 * PV = 10 * (F * R) / ln(P ^ priceSensv)
 *     = 10 * (F * R) / (priceSensv * ln(P))
 *
 * @param facilityScore - Facility score (0–1)
 * @param rating - Normalized rating (1–5, or scaled)
 * @param ratingCount - Number of ratings
 * @param P - Hotel price
 * @returns PV score
 */
export function calcPVR(
  facilityScore: number,
  rating: number,
  ratingCount: number,
  price: number,
): number {
  if (price <= 0) {
    return 0;
  }

  const F = facilityScore;
  const R = normalizeRating(rating, ratingCount);

  const P = price / 2;

  console.log(
    "Calculating PVR with params:",
    JSON.stringify({ F, R, P, PRICE_SENSITIVITY }),
  );

  const pvr = calcPVRWithPrice(F, R, P, PRICE_SENSITIVITY);

  return pvr;
}

/**
 * Calculate Price-to-Value Ratio (PV)
 *
 * Formula:
 * PV = 10 * (F * R) / ln(P ^ priceSensv)
 *     = 10 * (F * R) / (priceSensv * ln(P))
 *
 * @param F - Facility score (0–1)
 * @param R - Normalized rating (1–5, or scaled)
 * @param P - Hotel price
 * @param priceSensv - Price sensitivity.
 * @returns PV score
 */
function calcPVRWithPrice(
  F: number,
  R: number,
  P: number,
  priceSensv: number,
): number {
  if (P <= 0 || priceSensv <= 0) {
    throw new Error("Price and median price must be positive numbers.");
  }

  const numerator = F * R;
  const denominator = priceSensv * Math.log(P); // ln(P)
  const PV = (10 * numerator) / denominator;

  console.log(
    "Calculating PVR with params:",
    JSON.stringify({ F, R, P, priceSensv }),
  );

  return Math.ceil(PV * 100) / 100;
}
