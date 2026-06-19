/**
 * Manipulation primitives — the small set of moves that "push" the color faces.
 *
 * The three input controls map one-to-one onto the three stimulation axes:
 *   - vertical drag   → {@link adjustStimulation} (chroma / intensity of both)
 *   - horizontal drag → {@link adjustHueDistance} (spread B's hue from A)
 *   - bottom buttons  → {@link adjustContrast}     (split lightness apart)
 *
 * Every function is pure: it returns a new {@link Pair} and never mutates input.
 * A `lock` argument supports "고정" mode, where one color is frozen and only the
 * other may move.
 */
import { CHROMA_MAX } from './constants';
import { clamp, clamp01, normalizeHue } from './color';
import type { Oklch, Pair } from './types';

/** Which color (if any) is locked and must not change. */
export type Lock = 'a' | 'b' | null;

const MIN_L = 0.05;
const MAX_L = 0.97;

/**
 * Vertical-drag lever: change the shared chroma (intensity) of both colors.
 * `delta` is in chroma units. In fixed mode only the unlocked color moves.
 */
export function adjustStimulation(pair: Pair, delta: number, lock: Lock = null): Pair {
  const bump = (color: Oklch): Oklch => ({
    ...color,
    c: clamp(color.c + delta, 0, CHROMA_MAX),
  });
  return {
    a: lock === 'a' ? pair.a : bump(pair.a),
    b: lock === 'b' ? pair.b : bump(pair.b),
  };
}

/**
 * Horizontal-drag lever: change the hue distance between the two colors.
 * `delta` is in degrees. The spread is symmetric (both hues rotate apart) unless
 * one color is locked, in which case only the free color rotates.
 */
export function adjustHueDistance(pair: Pair, delta: number, lock: Lock = null): Pair {
  if (lock === 'a') {
    return { a: pair.a, b: { ...pair.b, h: normalizeHue(pair.b.h + delta) } };
  }
  if (lock === 'b') {
    return { a: { ...pair.a, h: normalizeHue(pair.a.h - delta) }, b: pair.b };
  }
  const half = delta / 2;
  return {
    a: { ...pair.a, h: normalizeHue(pair.a.h - half) },
    b: { ...pair.b, h: normalizeHue(pair.b.h + half) },
  };
}

/**
 * Contrast button lever: push the two lightnesses apart (delta > 0) or together
 * (delta < 0) around their midpoint. In fixed mode the free color moves the full
 * delta away from / toward the locked one.
 */
export function adjustContrast(pair: Pair, delta: number, lock: Lock = null): Pair {
  // Identify which color is the lighter one so "increase" always means spread.
  const aIsLighter = pair.a.l >= pair.b.l;

  if (lock === 'a') {
    const dir = pair.b.l <= pair.a.l ? -1 : 1; // move b further from a
    return { a: pair.a, b: { ...pair.b, l: clamp(pair.b.l + dir * delta, MIN_L, MAX_L) } };
  }
  if (lock === 'b') {
    const dir = pair.a.l <= pair.b.l ? -1 : 1;
    return { a: { ...pair.a, l: clamp(pair.a.l + dir * delta, MIN_L, MAX_L) }, b: pair.b };
  }

  const half = delta / 2;
  const lighter = aIsLighter ? 'a' : 'b';
  const adjust = (color: Oklch, isLighter: boolean): Oklch => ({
    ...color,
    l: clamp(color.l + (isLighter ? half : -half), MIN_L, MAX_L),
  });
  return {
    a: adjust(pair.a, lighter === 'a'),
    b: adjust(pair.b, lighter === 'b'),
  };
}

/** Build a pair from a base lightness, chroma, base hue, hue distance, contrast. */
export function pairFromParams(params: {
  baseLightness: number;
  chroma: number;
  baseHue: number;
  hueDistance: number;
  contrast: number;
}): Pair {
  const { baseLightness, chroma, baseHue, hueDistance, contrast } = params;
  const half = contrast / 2;
  return {
    a: {
      l: clamp(baseLightness - half, MIN_L, MAX_L),
      c: clamp(chroma, 0, CHROMA_MAX),
      h: normalizeHue(baseHue),
    },
    b: {
      l: clamp(baseLightness + half, MIN_L, MAX_L),
      c: clamp(chroma, 0, CHROMA_MAX),
      h: normalizeHue(baseHue + hueDistance),
    },
  };
}

export { clamp01 };
