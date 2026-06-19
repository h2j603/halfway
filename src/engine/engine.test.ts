import { describe, it, expect } from 'vitest';
import {
  hexToOklch,
  oklchToHex,
  contrastRatio,
  hueDistance,
  stimulation,
  bandOf,
  isVibrating,
  checkVibration,
  adjustStimulation,
  adjustHueDistance,
  adjustContrast,
  nudgeColor,
  setColor,
  pairFromParams,
  suggestAdjustments,
  generateCandidates,
  caption,
} from './index';
import type { Oklch, Pair } from './types';

const RED = hexToOklch('#FF0000');
const BLUE = hexToOklch('#0000FF');
const YELLOW = hexToOklch('#FFFF00');
const VIOLET = hexToOklch('#8000FF');
const WHITE = hexToOklch('#FFFFFF');
const GRAY = hexToOklch('#808080');

describe('color conversion', () => {
  it('round-trips primary hexes within tolerance', () => {
    for (const hex of ['#FF0000', '#00FF00', '#0000FF', '#123456', '#ABCDEF']) {
      const back = oklchToHex(hexToOklch(hex));
      expect(back).toBe(hex.toUpperCase());
    }
  });

  it('white is near L=1 and black near L=0', () => {
    expect(WHITE.l).toBeGreaterThan(0.99);
    expect(hexToOklch('#000000').l).toBeLessThan(0.01);
  });

  it('clamps out-of-gamut chroma instead of throwing', () => {
    const wild: Oklch = { l: 0.6, c: 0.9, h: 30 };
    expect(() => oklchToHex(wild)).not.toThrow();
    expect(oklchToHex(wild)).toMatch(/^#[0-9A-F]{6}$/);
  });
});

describe('contrast ratio', () => {
  it('black/white is the maximum 21:1', () => {
    expect(contrastRatio(WHITE, hexToOklch('#000000'))).toBeCloseTo(21, 0);
  });
  it('identical colors are 1:1', () => {
    expect(contrastRatio(RED, RED)).toBeCloseTo(1, 5);
  });
});

describe('hue distance', () => {
  it('is 0 for identical hue and symmetric', () => {
    expect(hueDistance(RED, RED)).toBeCloseTo(0, 5);
    expect(hueDistance(RED, BLUE)).toBeCloseTo(hueDistance(BLUE, RED), 5);
  });
  it('never exceeds 180', () => {
    expect(hueDistance(RED, BLUE)).toBeLessThanOrEqual(180);
    expect(hueDistance({ l: 0.5, c: 0.1, h: 350 }, { l: 0.5, c: 0.1, h: 10 })).toBeCloseTo(20, 5);
  });
});

describe('stimulation model', () => {
  it('returns value in 0..1 with normalized terms', () => {
    const s = stimulation(RED, BLUE);
    expect(s.value).toBeGreaterThanOrEqual(0);
    expect(s.value).toBeLessThanOrEqual(1);
    for (const t of [s.chroma, s.hue, s.contrast]) {
      expect(t).toBeGreaterThanOrEqual(0);
      expect(t).toBeLessThanOrEqual(1);
    }
  });

  it('two identical grays sit at minimum stimulation', () => {
    expect(stimulation(GRAY, GRAY).value).toBeLessThan(0.1);
  });

  it('rises as hue distance grows, all else equal', () => {
    const base: Oklch = { l: 0.6, c: 0.15, h: 0 };
    const near = stimulation(base, { l: 0.6, c: 0.15, h: 20 }).value;
    const far = stimulation(base, { l: 0.6, c: 0.15, h: 180 }).value;
    expect(far).toBeGreaterThan(near);
  });

  it('rises as lightness contrast grows, all else equal', () => {
    const lo = stimulation({ l: 0.5, c: 0.15, h: 30 }, { l: 0.55, c: 0.15, h: 30 }).value;
    const hi = stimulation({ l: 0.2, c: 0.15, h: 30 }, { l: 0.9, c: 0.15, h: 30 }).value;
    expect(hi).toBeGreaterThan(lo);
  });

  it('bands partition the 0..1 range', () => {
    expect(bandOf(0.1)).toBe('low');
    expect(bandOf(0.5)).toBe('central');
    expect(bandOf(0.9)).toBe('high');
  });
});

describe('vibrating detection', () => {
  it('flags vivid complementary colors at equal lightness', () => {
    const a: Oklch = { l: 0.6, c: 0.2, h: 25 };
    const b: Oklch = { l: 0.6, c: 0.2, h: 205 };
    expect(isVibrating(a, b)).toBe(true);
  });

  it('does NOT flag yellow/violet — their true OKLCH lightness differs', () => {
    // The HSL trap: both have HSL L≈50 but OKLCH lightness is far apart.
    expect(YELLOW.l - VIOLET.l).toBeGreaterThan(0.2);
    expect(isVibrating(YELLOW, VIOLET)).toBe(false);
  });

  it('does not flag low-chroma pairs even when hues are opposite', () => {
    const a: Oklch = { l: 0.6, c: 0.03, h: 25 };
    const b: Oklch = { l: 0.6, c: 0.03, h: 205 };
    expect(isVibrating(a, b)).toBe(false);
  });

  it('does not flag high-contrast pairs', () => {
    const a: Oklch = { l: 0.2, c: 0.2, h: 25 };
    const b: Oklch = { l: 0.9, c: 0.2, h: 205 };
    const check = checkVibration(a, b);
    expect(check.lightnessSimilar).toBe(false);
    expect(check.vibrating).toBe(false);
  });
});

describe('manipulation primitives are pure and bounded', () => {
  const pair: Pair = { a: { l: 0.4, c: 0.1, h: 20 }, b: { l: 0.6, c: 0.1, h: 200 } };

  it('adjustStimulation does not mutate input and clamps chroma', () => {
    const snapshot = JSON.stringify(pair);
    const up = adjustStimulation(pair, 0.5);
    expect(JSON.stringify(pair)).toBe(snapshot);
    expect(up.a.c).toBeLessThanOrEqual(0.37);
    expect(up.a.c).toBeGreaterThan(pair.a.c);
    const down = adjustStimulation(pair, -5);
    expect(down.a.c).toBeGreaterThanOrEqual(0);
  });

  it('adjustHueDistance increases hue distance for positive delta', () => {
    const before = hueDistance(pair.a, pair.b);
    const after = adjustHueDistance(pair, -40);
    expect(hueDistance(after.a, after.b)).toBeLessThan(before);
  });

  it('adjustContrast spreads lightness for positive delta', () => {
    const before = Math.abs(pair.a.l - pair.b.l);
    const after = adjustContrast(pair, 0.2);
    expect(Math.abs(after.a.l - after.b.l)).toBeGreaterThan(before);
  });

  it('respects a lock on color a', () => {
    const after = adjustStimulation(pair, 0.2, 'a');
    expect(after.a).toEqual(pair.a);
    expect(after.b.c).toBeGreaterThan(pair.b.c);
  });

  it('nudgeColor edits only the chosen color, wraps hue, clamps l/c', () => {
    const moved = nudgeColor(pair, 'b', { hue: 200, lightness: 0.3, chroma: 0.05 });
    expect(moved.a).toEqual(pair.a); // a untouched
    expect(moved.b.h).toBeCloseTo((pair.b.h + 200) % 360, 5);
    expect(moved.b.l).toBeGreaterThan(pair.b.l);
    // hue wraps around 360
    const wrapped = nudgeColor({ a: pair.a, b: { l: 0.5, c: 0.1, h: 350 } }, 'b', { hue: 30 });
    expect(wrapped.b.h).toBeCloseTo(20, 5);
    // lightness clamps within bounds
    const tooDark = nudgeColor(pair, 'a', { lightness: -5 });
    expect(tooDark.a.l).toBeGreaterThanOrEqual(0.05);
  });

  it('setColor sets absolute values on one color, leaving the other intact', () => {
    const out = setColor(pair, 'a', { h: 123, l: 0.7, c: 0.2 });
    expect(out.b).toEqual(pair.b);
    expect(out.a).toEqual({ h: 123, l: 0.7, c: 0.2 });
    // partial patch keeps the rest
    const hueOnly = setColor(pair, 'a', { h: 45 });
    expect(hueOnly.a.l).toBe(pair.a.l);
    expect(hueOnly.a.h).toBe(45);
  });

  it('two colors are fully independent — A can be blue while B is green', () => {
    let p: Pair = { a: { l: 0.5, c: 0.15, h: 0 }, b: { l: 0.5, c: 0.15, h: 0 } };
    p = setColor(p, 'a', { h: 260 }); // blue
    p = setColor(p, 'b', { h: 145 }); // green
    expect(p.a.h).toBe(260);
    expect(p.b.h).toBe(145);
    expect(hueDistance(p.a, p.b)).toBeGreaterThan(100);
  });

  it('pairFromParams composes the expected hue distance and contrast', () => {
    const p = pairFromParams({
      baseLightness: 0.5,
      chroma: 0.12,
      baseHue: 0,
      hueDistance: 120,
      contrast: 0.4,
    });
    expect(hueDistance(p.a, p.b)).toBeCloseTo(120, 1);
    expect(Math.abs(p.a.l - p.b.l)).toBeCloseTo(0.4, 5);
  });
});

describe('suggestAdjustments (diagnosis)', () => {
  it('offers exactly the three vibration prescriptions for a vibrating pair', () => {
    const vibrating: Pair = {
      a: { l: 0.6, c: 0.2, h: 25 },
      b: { l: 0.6, c: 0.2, h: 205 },
    };
    const out = suggestAdjustments(vibrating);
    expect(out).toHaveLength(3);
    expect(out.map((a) => a.axis).sort()).toEqual(['contrast', 'hueDistance', 'stimulation']);
    // Every proposal carries a non-empty "why" — never random.
    for (const adj of out) {
      expect(adj.why.length).toBeGreaterThan(0);
      expect(adj.label.length).toBeGreaterThan(0);
    }
    // Each prescription actually stops the vibration.
    for (const adj of out) {
      expect(isVibrating(adj.result.a, adj.result.b)).toBe(false);
    }
  });

  it('confirms a pair already in the central band without forcing change', () => {
    const central: Pair = {
      a: { l: 0.32, c: 0.1, h: 30 },
      b: { l: 0.62, c: 0.1, h: 140 },
    };
    expect(bandOf(stimulation(central.a, central.b).value)).toBe('central');
    const out = suggestAdjustments(central);
    expect(out).toHaveLength(1);
    expect(out[0].result).toEqual(central);
  });
});

describe('generateCandidates', () => {
  const anchor: Pair = { a: { l: 0.4, c: 0.12, h: 20 }, b: { l: 0.6, c: 0.12, h: 160 } };

  it('keeps every candidate within tolerance of the anchor stimulation', () => {
    const target = stimulation(anchor.a, anchor.b).value;
    const cands = generateCandidates(anchor, 7, 0.06);
    expect(cands.length).toBeGreaterThan(1);
    for (const c of cands) {
      expect(Math.abs(c.stimulation - target)).toBeLessThanOrEqual(0.06 + 1e-6);
    }
  });

  it('includes the anchor itself', () => {
    const cands = generateCandidates(anchor, 5);
    expect(cands.some((c) => JSON.stringify(c.pair) === JSON.stringify(anchor))).toBe(true);
  });
});

describe('caption', () => {
  it('warns and prescribes when vibrating', () => {
    const vibrating: Pair = { a: { l: 0.6, c: 0.2, h: 25 }, b: { l: 0.6, c: 0.2, h: 205 } };
    const c = caption(vibrating);
    expect(c.warning).toBe(true);
    expect(c.text).toMatch(/진동/);
  });

  it('describes a calm pair without warning', () => {
    const calm: Pair = { a: { l: 0.5, c: 0.04, h: 30 }, b: { l: 0.55, c: 0.04, h: 50 } };
    const c = caption(calm);
    expect(c.warning).toBe(false);
    expect(c.text).toMatch(/지금:/);
  });
});
