/**
 * Status caption mapping (spec §1, step 3) — the always-on one-liner that
 * explains "왜 이 방향" (why this feels the way it does). Small and restrained;
 * it reads the stimulation breakdown and turns it into plain language.
 */
import { stimulation, bandOf, hueDistance } from './stimulation';
import { checkVibration } from './vibrating';
import type { Oklch, Pair } from './types';

function hueWord(a: Oklch, b: Oklch): string {
  const d = hueDistance(a, b);
  if (d < 30) return '유사 색상';
  if (d < 75) return '가까운 색상';
  if (d < 135) return '직각 색상';
  return '먼 색상';
}

function contrastWord(a: Oklch, b: Oklch): string {
  const d = Math.abs(a.l - b.l);
  if (d < 0.12) return '낮은 명암대비';
  if (d < 0.35) return '중간 명암대비';
  return '강한 명암대비';
}

function moodWord(value: number): string {
  const band = bandOf(value);
  if (band === 'low') return '차분하고 잔잔함';
  if (band === 'high') return '강렬하고 들뜸';
  return '활기차고 안정적';
}

/**
 * Build the status caption for a pair. When the pair vibrates, the caption turns
 * into a warning plus a one-line prescription, as the spec requires.
 */
export function caption(pair: Pair): { text: string; warning: boolean } {
  const vib = checkVibration(pair.a, pair.b);
  if (vib.vibrating) {
    return {
      text: '진동(vibrating) 주의 — 명도를 벌리거나 채도를 낮춰 떨림을 가라앉히세요.',
      warning: true,
    };
  }
  const { value } = stimulation(pair.a, pair.b);
  const text = `지금: ${contrastWord(pair.a, pair.b)}·${hueWord(
    pair.a,
    pair.b,
  )} → ${moodWord(value)}`;
  return { text, warning: false };
}
