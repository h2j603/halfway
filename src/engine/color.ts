/**
 * OKLCH ↔ HEX conversion and WCAG contrast, all delegated to culori per the spec
 * ("직접 구현 최소화"). This is the only module that talks to culori; the rest of
 * the engine works in plain {@link Oklch} structs.
 */
import {
  converter,
  formatHex,
  parse,
  clampChroma,
  wcagContrast,
  type Oklch as CuloriOklch,
} from 'culori';
import type { Oklch } from './types';

const toOklch = converter('oklch');
const toRgb = converter('rgb');

/**
 * Tolerance (in linearized 0…1 rgb channel space) below which an out-of-gamut
 * color is treated as in-gamut and simply clipped. Pure sRGB primaries (notably
 * blue) round-trip to a hair outside gamut; clipping that tiny overflow is exact,
 * whereas clampChroma's binary search would visibly shift the hue.
 */
const GAMUT_EPS = 0.02;

function withinSrgb(c: CuloriOklch): boolean {
  const rgb = toRgb(c);
  if (!rgb) return false;
  return (['r', 'g', 'b'] as const).every(
    (k) => rgb[k] >= -GAMUT_EPS && rgb[k] <= 1 + GAMUT_EPS,
  );
}

/** Clamp a number into [min, max]. */
export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/** Clamp into 0…1. */
export function clamp01(n: number): number {
  return clamp(n, 0, 1);
}

/** Normalize a hue angle into 0…360. */
export function normalizeHue(h: number): number {
  return ((h % 360) + 360) % 360;
}

/** Parse a HEX (or any CSS color string) into OKLCH. Throws on unparseable input. */
export function hexToOklch(input: string): Oklch {
  const parsed = parse(input);
  if (!parsed) throw new Error(`Cannot parse color: ${input}`);
  const c = toOklch(parsed) as CuloriOklch;
  return {
    l: c.l ?? 0,
    c: c.c ?? 0,
    // culori leaves hue undefined for achromatic colors; 0 is a safe placeholder.
    h: normalizeHue(c.h ?? 0),
  };
}

/**
 * Convert OKLCH to a HEX string. Out-of-gamut colors are pulled back into the
 * sRGB gamut by reducing chroma (clampChroma) so the displayed swatch is honest
 * rather than silently clipped per-channel.
 */
export function oklchToHex(color: Oklch): string {
  const c: CuloriOklch = {
    mode: 'oklch',
    l: clamp01(color.l),
    c: Math.max(0, color.c),
    h: normalizeHue(color.h),
  };
  // Only reduce chroma when the color is genuinely out of gamut; otherwise let
  // formatHex clip the negligible overflow (keeps edge colors like blue exact).
  const fitted = withinSrgb(c) ? c : (clampChroma(c, 'oklch') as CuloriOklch);
  return (formatHex(fitted) ?? '#000000').toUpperCase();
}

/** A CSS `oklch()` string for direct use in styles (browser renders in-gamut). */
export function oklchToCss(color: Oklch): string {
  return `oklch(${clamp01(color.l)} ${Math.max(0, color.c)} ${normalizeHue(color.h)})`;
}

/**
 * WCAG 2.x contrast ratio (1…21) between two OKLCH colors. This is a separate
 * channel from the stimulation model — it exists only as a readability warning,
 * as the spec notes ("색공간 계산과는 별개 채널").
 */
export function contrastRatio(a: Oklch, b: Oklch): number {
  return wcagContrast(oklchToHex(a), oklchToHex(b));
}

/** True when a color is meaningfully out of the sRGB gamut (beyond clip tolerance). */
export function isOutOfGamut(color: Oklch): boolean {
  const c: CuloriOklch = {
    mode: 'oklch',
    l: clamp01(color.l),
    c: Math.max(0, color.c),
    h: normalizeHue(color.h),
  };
  return !withinSrgb(c);
}
