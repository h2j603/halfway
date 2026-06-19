import { useRef, type PointerEvent as ReactPointerEvent } from 'react';
import { oklchToCss, type Pair } from '../engine';

export type Layout = 'half' | 'diagonal' | 'shape';

interface Props {
  pair: Pair;
  layout: Layout;
  /** Currently selected face (the one sliders act on). */
  selected: 'a' | 'b';
  onSelect: (which: 'a' | 'b') => void;
  /** Continuous drag deltas for one face: hue in degrees, lightness in 0…1 units. */
  onColorDrag: (which: 'a' | 'b', delta: { hue: number; lightness: number }) => void;
}

// A full-width drag sweeps the whole hue wheel; a full-height drag spans lightness.
const HUE_SPAN = 360;
const LIGHT_SPAN = 1;

/**
 * The big color field — now a *direct* editor. You drag a face to change that
 * color: left/right = hue (full wheel), up/down = lightness. Tap a face to
 * select it for the sliders. Each color moves independently, so any pair is
 * reachable. Layout only changes how the two faces are arranged (view-only).
 */
export function ColorField({ pair, layout, selected, onSelect, onColorDrag }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const active = useRef<'a' | 'b' | null>(null);
  const moved = useRef(false);
  const last = useRef({ x: 0, y: 0 });

  function faceAt(target: EventTarget | null): 'a' | 'b' | null {
    const el = (target as HTMLElement | null)?.closest('[data-face]');
    return (el?.getAttribute('data-face') as 'a' | 'b' | null) ?? null;
  }

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    const which = faceAt(e.target);
    if (!which) return;
    active.current = which;
    moved.current = false;
    last.current = { x: e.clientX, y: e.clientY };
    onSelect(which);
    ref.current?.setPointerCapture(e.pointerId);
    ref.current?.classList.add('dragging');
  }

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!active.current || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const dx = (e.clientX - last.current.x) / rect.width;
    const dy = (e.clientY - last.current.y) / rect.height;
    if (Math.abs(dx) > 0.002 || Math.abs(dy) > 0.002) moved.current = true;
    last.current = { x: e.clientX, y: e.clientY };
    // Right = hue advances; up = lighter.
    onColorDrag(active.current, { hue: dx * HUE_SPAN, lightness: -dy * LIGHT_SPAN });
  }

  function endDrag(e: ReactPointerEvent<HTMLDivElement>) {
    active.current = null;
    ref.current?.releasePointerCapture(e.pointerId);
    ref.current?.classList.remove('dragging');
  }

  return (
    <div
      className="field"
      ref={ref}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      {renderFaces(layout, pair, selected)}

      <div className="axis-hint">
        색면을 끌어 조절
        <br />↔ 색상 · ↕ 명도
      </div>
    </div>
  );
}

function faceProps(which: 'a' | 'b', selected: 'a' | 'b', bg: string): React.HTMLAttributes<HTMLDivElement> & { 'data-face': string } {
  return {
    className: `face${selected === which ? ' selected' : ''}`,
    'data-face': which,
    style: { background: bg },
  };
}

function renderFaces(layout: Layout, pair: Pair, selected: 'a' | 'b') {
  const a = oklchToCss(pair.a);
  const b = oklchToCss(pair.b);

  if (layout === 'diagonal') {
    return (
      <>
        <div {...faceProps('b', selected, b)} />
        <div
          {...faceProps('a', selected, a)}
          style={{ background: a, clipPath: 'polygon(0 0, 100% 0, 0 100%)' }}
        />
      </>
    );
  }
  if (layout === 'shape') {
    return (
      <>
        <div {...faceProps('b', selected, b)} />
        <div
          {...faceProps('a', selected, a)}
          style={{
            background: a,
            inset: 'auto',
            left: '18%',
            top: '20%',
            width: '52%',
            height: '60%',
            borderRadius: '12px',
            position: 'absolute',
          }}
        />
      </>
    );
  }
  // half — A on top, B on bottom, the default abutting layout.
  return (
    <>
      <div {...faceProps('a', selected, a)} style={{ background: a, bottom: '50%' }} />
      <div {...faceProps('b', selected, b)} style={{ background: b, top: '50%' }} />
    </>
  );
}
