/**
 * Core data types for the Halfway engine.
 *
 * Everything internal is expressed in OKLCH — the spec forbids HSL because its
 * L channel does not track perceived lightness (yellow vs. violet), which would
 * make the vibrating detector mis-fire.
 */

/** A single color in OKLCH. */
export interface Oklch {
  /** Perceptual lightness, 0 (black) … 1 (white). */
  l: number;
  /** Chroma, 0 (gray) … ~0.37 (most saturated sRGB colors). */
  c: number;
  /** Hue angle in degrees, 0 … 360. Meaningless when c === 0. */
  h: number;
}

/** The two color faces the whole tool revolves around. */
export interface Pair {
  a: Oklch;
  b: Oklch;
}

/** The three axes stimulation is a function of, each normalized to 0…1. */
export interface StimulationBreakdown {
  /** Weighted total, 0…1. The single "feel" scale the spec is built around. */
  value: number;
  /** Average chroma contribution (saturation → stimulation). */
  chroma: number;
  /** Hue-distance contribution (0 = same hue, 1 = complementary). */
  hue: number;
  /** Lightness-contrast contribution (|Δlightness|). */
  contrast: number;
}

/** One of the three manipulation axes. */
export type Axis = 'stimulation' | 'hueDistance' | 'contrast';

/** A single labelled correction proposal (diagnosis mode). */
export interface Adjustment {
  /** Which axis this proposal moves. */
  axis: Axis;
  /** Direction along the axis. */
  direction: 'increase' | 'decrease';
  /** Short imperative title, e.g. "명암대비를 올려 진동 완화". */
  label: string;
  /** One-line "why", the differentiator vs. a plain color picker. */
  why: string;
  /** The resulting pair if this proposal is applied. */
  result: Pair;
}
