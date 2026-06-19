import { useRef, type PointerEvent as ReactPointerEvent } from 'react';
import { oklchToCss, type Pair } from '../engine';

interface Props {
  pair: Pair;
  selected: 'a' | 'b';
  onSelect: (which: 'a' | 'b') => void;
  /** Continuous drag deltas for one circle: hue in degrees, lightness in 0…1. */
  onColorDrag: (which: 'a' | 'b', delta: { hue: number; lightness: number }) => void;
}

const HUE_SPAN = 360;
const LIGHT_SPAN = 1;

/** The two color circles — tap to select, drag to change (↔ hue, ↕ lightness). */
export function CircleField({ pair, selected, onSelect, onColorDrag }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const active = useRef<'a' | 'b' | null>(null);
  const last = useRef({ x: 0, y: 0 });

  function faceAt(target: EventTarget | null): 'a' | 'b' | null {
    const el = (target as HTMLElement | null)?.closest('[data-face]');
    return (el?.getAttribute('data-face') as 'a' | 'b' | null) ?? null;
  }

  function down(e: ReactPointerEvent<HTMLDivElement>) {
    const which = faceAt(e.target);
    if (!which) return;
    active.current = which;
    last.current = { x: e.clientX, y: e.clientY };
    onSelect(which);
    ref.current?.setPointerCapture(e.pointerId);
    ref.current?.classList.add('dragging');
  }

  function move(e: ReactPointerEvent<HTMLDivElement>) {
    if (!active.current || !ref.current) return;
    const w = ref.current.getBoundingClientRect();
    const dx = (e.clientX - last.current.x) / Math.max(1, w.width);
    const dy = (e.clientY - last.current.y) / Math.max(1, w.height);
    last.current = { x: e.clientX, y: e.clientY };
    onColorDrag(active.current, { hue: dx * HUE_SPAN, lightness: -dy * LIGHT_SPAN });
  }

  function up(e: ReactPointerEvent<HTMLDivElement>) {
    active.current = null;
    ref.current?.releasePointerCapture(e.pointerId);
    ref.current?.classList.remove('dragging');
  }

  return (
    <div
      className="circles"
      ref={ref}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
    >
      <button
        type="button"
        className={`circle${selected === 'a' ? ' selected' : ''}`}
        data-face="a"
        aria-label="색 A"
        style={{ background: oklchToCss(pair.a) }}
      />
      <button
        type="button"
        className={`circle b${selected === 'b' ? ' selected' : ''}`}
        data-face="b"
        aria-label="색 B"
        style={{ background: oklchToCss(pair.b) }}
      />
    </div>
  );
}
