/**
 * The stimulation model — the heart of the tool (spec §2.1).
 *
 * Stimulation is treated as one felt scale that is a function of three axes:
 * chroma (saturation), hue distance, and lightness contrast. Each axis is
 * normalized to 0…1 and combined with tunable weights.
 */
import { CHROMA_MAX, STIMULATION_WEIGHTS, CENTRAL_BAND } from './constants';
import { clamp01 } from './color';
import type { Oklch, StimulationBreakdown } from './types';

/** Shortest angular distance between two hues, 0…180 (180 = complementary). */
export function hueDistance(a: Oklch, b: Oklch): number {
  let d = Math.abs(a.h - b.h) % 360;
  if (d > 180) d = 360 - d;
  return d;
}

/** Average chroma of the pair, normalized to 0…1 against {@link CHROMA_MAX}. */
export function chromaTerm(a: Oklch, b: Oklch): number {
  return clamp01((a.c + b.c) / 2 / CHROMA_MAX);
}

/** Hue-distance contribution, normalized to 0…1 (0° → 0, 180° → 1). */
export function hueTerm(a: Oklch, b: Oklch): number {
  return hueDistance(a, b) / 180;
}

/** Lightness-contrast contribution, normalized to 0…1. */
export function contrastTerm(a: Oklch, b: Oklch): number {
  return clamp01(Math.abs(a.l - b.l));
}

/**
 * Full stimulation breakdown for a pair. `value` is the weighted total; the
 * per-axis terms are surfaced so the UI can explain *why* a pair feels the way
 * it does.
 */
export function stimulation(a: Oklch, b: Oklch): StimulationBreakdown {
  const chroma = chromaTerm(a, b);
  const hue = hueTerm(a, b);
  const contrast = contrastTerm(a, b);
  const value =
    STIMULATION_WEIGHTS.chroma * chroma +
    STIMULATION_WEIGHTS.hue * hue +
    STIMULATION_WEIGHTS.contrast * contrast;
  return { value: clamp01(value), chroma, hue, contrast };
}

/** Where a stimulation value sits relative to the "just right" central band. */
export type Band = 'low' | 'central' | 'high';

export function bandOf(value: number): Band {
  if (value < CENTRAL_BAND.low) return 'low';
  if (value > CENTRAL_BAND.high) return 'high';
  return 'central';
}
