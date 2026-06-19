/**
 * Correction proposals (spec §2.3) — the diagnosis engine, and the decisive
 * differentiator from a plain color picker. Every proposal carries an explicit
 * "what & why" label. No random variation is allowed.
 */
import { STEPS, CENTRAL_BAND } from './constants';
import { stimulation, bandOf } from './stimulation';
import { checkVibration } from './vibrating';
import { adjustStimulation, adjustHueDistance, adjustContrast } from './manipulate';
import type { Adjustment, Pair } from './types';

/**
 * How hard each proposal pushes its axis. Sized so a single prescription is
 * enough to clear the corresponding vibration threshold on its own — a proposal
 * that only halfway resolves the problem would be worse than none.
 */
const PUSH = {
  contrast: STEPS.contrast * 4, // Δlightness ≈ 0.24 (> lightnessSimilar 0.16)
  chroma: STEPS.chroma * 0.32, // drops a vivid 0.2 chroma below chromaHigh 0.1
  hue: STEPS.hue * 0.55, // pulls a 180° split under hueFar 95°
};

function increaseContrast(pair: Pair, why: string): Adjustment {
  return {
    axis: 'contrast',
    direction: 'increase',
    label: '명암대비를 올려 진동 완화',
    why,
    result: adjustContrast(pair, PUSH.contrast),
  };
}

function decreaseChroma(pair: Pair, why: string): Adjustment {
  return {
    axis: 'stimulation',
    direction: 'decrease',
    label: '채도를 낮춰 진동 완화',
    why,
    result: adjustStimulation(pair, -PUSH.chroma),
  };
}

function narrowHue(pair: Pair, why: string): Adjustment {
  return {
    axis: 'hueDistance',
    direction: 'decrease',
    label: '색상거리를 좁혀 진동 완화',
    why,
    result: adjustHueDistance(pair, -PUSH.hue),
  };
}

/**
 * Propose labelled corrections for an input pair.
 *
 * - Vibrating → the three canonical "soften the vibration" prescriptions, each
 *   moving a different axis so the user can pick the trade-off they prefer.
 * - Otherwise high stimulation → soften toward the central band.
 * - Otherwise low stimulation → boost toward the central band.
 * - Already central → a single confirmation with no forced change.
 */
export function suggestAdjustments(pair: Pair): Adjustment[] {
  const { vibrating } = checkVibration(pair.a, pair.b);
  const { value } = stimulation(pair.a, pair.b);
  const band = bandOf(value);

  if (vibrating) {
    return [
      increaseContrast(pair, '두 색의 명도를 벌리면 진동의 핵심 조건(비슷한 명도)이 깨진다.'),
      decreaseChroma(pair, '채도를 낮추면 색의 강렬함이 줄어 눈의 떨림이 가라앉는다.'),
      narrowHue(pair, '색상거리를 좁혀 보색 대립을 누그러뜨린다.'),
    ];
  }

  if (band === 'high') {
    return [
      {
        axis: 'stimulation',
        direction: 'decrease',
        label: '채도를 낮춰 자극 완화',
        why: '자극이 중앙 지대보다 높다. 채도를 내려 "딱 맞는" 구간으로 끌어내린다.',
        result: adjustStimulation(pair, -PUSH.chroma),
      },
      {
        axis: 'contrast',
        direction: 'decrease',
        label: '명암대비를 낮춰 자극 완화',
        why: '명도 차를 줄이면 전체 자극량이 중앙 지대로 내려온다.',
        result: adjustContrast(pair, -PUSH.contrast),
      },
    ];
  }

  if (band === 'low') {
    return [
      {
        axis: 'stimulation',
        direction: 'increase',
        label: '채도를 올려 활기 부여',
        why: '자극이 중앙 지대보다 낮다. 채도를 올려 생기를 더한다.',
        result: adjustStimulation(pair, PUSH.chroma),
      },
      {
        axis: 'contrast',
        direction: 'increase',
        label: '명암대비를 올려 또렷하게',
        why: '명도 차를 키우면 두 색이 또렷해지고 자극이 중앙 지대로 올라온다.',
        result: adjustContrast(pair, PUSH.contrast),
      },
    ];
  }

  // Already in the central band — confirm, propose no forced change.
  return [
    {
      axis: 'stimulation',
      direction: 'increase',
      label: '이미 "딱 맞는" 중앙 지대',
      why: `자극량 ${(value * 100).toFixed(0)}%로 ${CENTRAL_BAND.low * 100}–${
        CENTRAL_BAND.high * 100
      }% 중앙 지대 안에 있다. 보정 없이 사용해도 좋다.`,
      result: pair,
    },
  ];
}
