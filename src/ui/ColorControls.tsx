import { oklchToHex, oklchToCss, COLOR_BOUNDS, type Pair } from '../engine';

interface Props {
  pair: Pair;
  selected: 'a' | 'b';
  onSelect: (which: 'a' | 'b') => void;
  /** Set absolute hue / lightness / chroma on the selected color. */
  onChange: (patch: { h?: number; l?: number; c?: number }) => void;
}

/**
 * Explicit, labelled controls for the selected color — hue, lightness, chroma.
 * Direct face-dragging covers quick moves; these sliders give precise, fully
 * free control over each color independently (the whole wheel, any lightness).
 */
export function ColorControls({ pair, selected, onSelect, onChange }: Props) {
  const color = pair[selected];

  return (
    <div className="controls">
      <div className="controls-head">
        <span className="controls-label">조절 대상</span>
        <div className="face-toggle">
          {(['a', 'b'] as const).map((w) => (
            <button
              key={w}
              className={selected === w ? 'on' : ''}
              onClick={() => onSelect(w)}
              style={{ ['--swatch' as string]: oklchToCss(pair[w]) }}
            >
              <span className="dot" style={{ background: oklchToCss(pair[w]) }} />
              {w.toUpperCase()} {oklchToHex(pair[w])}
            </button>
          ))}
        </div>
      </div>

      <Slider
        label="색상"
        min={0}
        max={360}
        step={1}
        value={color.h}
        suffix="°"
        onChange={(h) => onChange({ h })}
        track={hueTrack(color.l, color.c)}
      />
      <Slider
        label="명도"
        min={COLOR_BOUNDS.lMin}
        max={COLOR_BOUNDS.lMax}
        step={0.01}
        value={color.l}
        format={(v) => `${Math.round(v * 100)}%`}
        onChange={(l) => onChange({ l })}
        track={lightnessTrack(color.h, color.c)}
      />
      <Slider
        label="채도"
        min={0}
        max={COLOR_BOUNDS.cMax}
        step={0.005}
        value={color.c}
        format={(v) => v.toFixed(3)}
        onChange={(c) => onChange({ c })}
        track={chromaTrack(color.h, color.l)}
      />
    </div>
  );
}

interface SliderProps {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  suffix?: string;
  format?: (v: number) => string;
  onChange: (v: number) => void;
  track: string;
}

function Slider({ label, min, max, step, value, suffix, format, onChange, track }: SliderProps) {
  return (
    <label className="slider">
      <span className="slider-name">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ background: track }}
      />
      <span className="slider-val">{format ? format(value) : Math.round(value)}{suffix ?? ''}</span>
    </label>
  );
}

// Gradient tracks so each slider previews the color it would produce.
function hueTrack(l: number, c: number): string {
  const stops = [0, 60, 120, 180, 240, 300, 360]
    .map((h) => oklchToCss({ l, c, h }))
    .join(', ');
  return `linear-gradient(90deg, ${stops})`;
}
function lightnessTrack(h: number, c: number): string {
  return `linear-gradient(90deg, ${oklchToCss({ l: 0.05, c, h })}, ${oklchToCss({
    l: 0.97,
    c,
    h,
  })})`;
}
function chromaTrack(h: number, l: number): string {
  return `linear-gradient(90deg, ${oklchToCss({ l, c: 0, h })}, ${oklchToCss({
    l,
    c: COLOR_BOUNDS.cMax,
    h,
  })})`;
}
