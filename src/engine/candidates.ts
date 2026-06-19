/**
 * Candidate generation (spec §2.4) — "other pairs at a similar stimulation".
 *
 * Feeds the spectrum strip beside the result. We sample variations around the
 * current pair that keep the overall stimulation close to the anchor's, so the
 * strip reads as "the same energy, different flavor" rather than random colors.
 */
import { stimulation } from './stimulation';
import { adjustHueDistance, adjustStimulation, adjustContrast } from './manipulate';
import type { Pair } from './types';

export interface Candidate {
  pair: Pair;
  /** Stimulation value of this candidate (for sorting / display). */
  stimulation: number;
}

/**
 * Generate `count` candidates near `anchor` whose stimulation stays within
 * `tolerance` of the anchor's. We perturb hue distance and contrast (trading one
 * off against the other) and re-balance chroma to hold stimulation roughly fixed.
 */
export function generateCandidates(
  anchor: Pair,
  count = 7,
  tolerance = 0.06,
): Candidate[] {
  const target = stimulation(anchor.a, anchor.b).value;
  const out: Candidate[] = [];

  // Spread samples symmetrically around the anchor along the hue/contrast trade.
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0 : (i / (count - 1)) * 2 - 1; // -1 … 1

    // Rotate hue distance one way and compensate contrast the other way.
    let pair = adjustHueDistance(anchor, t * 70);
    pair = adjustContrast(pair, -t * 0.12);

    // Re-balance chroma to pull the candidate's stimulation back toward target.
    const drift = stimulation(pair.a, pair.b).value - target;
    if (Math.abs(drift) > 1e-3) {
      pair = adjustStimulation(pair, -drift * 0.9);
    }

    const value = stimulation(pair.a, pair.b).value;
    if (Math.abs(value - target) <= tolerance) {
      out.push({ pair, stimulation: value });
    }
  }

  // Always include the anchor itself, centered.
  out.splice(Math.floor(out.length / 2), 0, {
    pair: anchor,
    stimulation: target,
  });

  return out;
}
