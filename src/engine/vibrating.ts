/**
 * Vibrating detection (spec §2.2) — the most unpleasant high-stimulation zone.
 *
 * A pair vibrates when all three hold at once:
 *   1. the two hues are far apart (contrasting),
 *   2. the two lightnesses are similar (low contrast),
 *   3. both chromas are high (vivid).
 *
 * This is exactly why OKLCH is mandatory: HSL's L would not capture the real
 * lightness gap between, say, yellow and violet, producing false positives.
 */
import { VIBRATING } from './constants';
import { hueDistance } from './stimulation';
import type { Oklch } from './types';

export interface VibrationCheck {
  vibrating: boolean;
  /** Whether each of the three conditions is met (for debugging / UI hints). */
  hueFar: boolean;
  lightnessSimilar: boolean;
  bothVivid: boolean;
}

export function checkVibration(a: Oklch, b: Oklch): VibrationCheck {
  const hueFar = hueDistance(a, b) >= VIBRATING.hueFar;
  const lightnessSimilar = Math.abs(a.l - b.l) <= VIBRATING.lightnessSimilar;
  const bothVivid = a.c >= VIBRATING.chromaHigh && b.c >= VIBRATING.chromaHigh;
  return {
    vibrating: hueFar && lightnessSimilar && bothVivid,
    hueFar,
    lightnessSimilar,
    bothVivid,
  };
}

/** Convenience boolean wrapper around {@link checkVibration}. */
export function isVibrating(a: Oklch, b: Oklch): boolean {
  return checkVibration(a, b).vibrating;
}
