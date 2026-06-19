/**
 * Tunable constants for the stimulation model and detectors.
 *
 * The spec is explicit that these must be "상수로 빼서 튜닝 가능하게" — pulled out
 * as constants so the model can be tuned without touching the logic. If the
 * stimulation model drifts, every UI affordance built on top drifts with it, so
 * this file is the single source of truth.
 */

/** Practical maximum OKLCH chroma for sRGB colors; used to normalize chroma to 0…1. */
export const CHROMA_MAX = 0.37;

/**
 * Weights for the three stimulation axes. Kept summing to 1 so `value` stays in 0…1.
 */
export const STIMULATION_WEIGHTS = {
  chroma: 0.34,
  hue: 0.33,
  contrast: 0.33,
} as const;

/**
 * Thresholds for `isVibrating`. A pair vibrates when hues are far apart, the
 * lightnesses are close (low contrast), and both colors are vivid.
 */
export const VIBRATING = {
  /** Hue distance (deg) above which two hues count as "far / contrasting". */
  hueFar: 95,
  /** |Δlightness| below which the two lightnesses count as "similar". */
  lightnessSimilar: 0.16,
  /** Chroma above which a color counts as "vivid"; both must clear it. */
  chromaHigh: 0.1,
} as const;

/**
 * The "just right" central band of stimulation the whole tool steers toward.
 * Outside this band the status caption nudges the user back in.
 */
export const CENTRAL_BAND = {
  low: 0.34,
  high: 0.62,
} as const;

/** Step sizes used by the manipulation helpers (per drag-unit / button press). */
export const STEPS = {
  /** Chroma delta applied to both colors per unit of vertical drag. */
  chroma: 0.37,
  /** Hue-distance delta (deg) per unit of horizontal drag. */
  hue: 180,
  /** Lightness-contrast delta per contrast button press. */
  contrast: 0.06,
} as const;
