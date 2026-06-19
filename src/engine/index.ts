/**
 * Public surface of the Halfway engine. The UI imports only from here.
 */
export * from './types';
export * from './constants';
export {
  clamp,
  clamp01,
  normalizeHue,
  hexToOklch,
  oklchToHex,
  oklchToCss,
  contrastRatio,
  isOutOfGamut,
} from './color';
export {
  hueDistance,
  chromaTerm,
  hueTerm,
  contrastTerm,
  stimulation,
  bandOf,
  type Band,
} from './stimulation';
export { checkVibration, isVibrating, type VibrationCheck } from './vibrating';
export {
  adjustStimulation,
  adjustHueDistance,
  adjustContrast,
  nudgeColor,
  setColor,
  pairFromParams,
  COLOR_BOUNDS,
  type Lock,
} from './manipulate';
export { suggestAdjustments } from './suggest';
export { generateCandidates, type Candidate } from './candidates';
export { caption } from './caption';
