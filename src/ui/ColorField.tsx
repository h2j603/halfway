import { useRef, type PointerEvent as ReactPointerEvent } from 'react';
import { oklchToCss, type Pair, type Lock } from '../engine';

export type Layout = 'half' | 'diagonal' | 'shape';

interface Props {
  pair: Pair;
  layout: Layout;
  lock: Lock;
  /** Called continuously during drag with per-move deltas (already scaled). */
  onDrag: (deltas: { chroma: number; hue: number }) => void;
  onLockToggle?: (which: 'a' | 'b') => void;
}

/**
 * The big color field. Vertical drag → chroma (stimulation intensity),
 * horizontal drag → hue distance. The layout prop only changes *how* the two
 * faces are arranged; it never changes the color values (spec: 뷰 모드 전용).
 */
export function ColorField({ pair, layout, lock, onDrag, onLockToggle }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const last = useRef({ x: 0, y: 0 });

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if ((e.target as HTMLElement).closest('.lock-badge')) return;
    dragging.current = true;
    last.current = { x: e.clientX, y: e.clientY };
    ref.current?.setPointerCapture(e.pointerId);
    ref.current?.classList.add('dragging');
  }

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!dragging.current || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const dx = (e.clientX - last.current.x) / rect.width;
    const dy = (e.clientY - last.current.y) / rect.height;
    last.current = { x: e.clientX, y: e.clientY };
    // Up (negative dy) increases stimulation; right (positive dx) widens hue.
    onDrag({ chroma: -dy, hue: dx });
  }

  function endDrag(e: ReactPointerEvent<HTMLDivElement>) {
    dragging.current = false;
    ref.current?.releasePointerCapture(e.pointerId);
    ref.current?.classList.remove('dragging');
  }

  const aCss = oklchToCss(pair.a);
  const bCss = oklchToCss(pair.b);

  return (
    <div
      className="field"
      ref={ref}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      {renderFaces(layout, aCss, bCss)}

      {lock && onLockToggle && (
        <>
          <button
            className="lock-badge"
            style={lockPos('a', layout)}
            onClick={() => onLockToggle('a')}
            title="잠금 토글"
          >
            {lock === 'a' ? '🔒 A' : '🔓 A'}
          </button>
          <button
            className="lock-badge"
            style={lockPos('b', layout)}
            onClick={() => onLockToggle('b')}
            title="잠금 토글"
          >
            {lock === 'b' ? '🔒 B' : '🔓 B'}
          </button>
        </>
      )}

      <div className="axis-hint">
        ↕ 자극(채도)
        <br />
        ↔ 색상거리
      </div>
    </div>
  );
}

function renderFaces(layout: Layout, a: string, b: string) {
  if (layout === 'diagonal') {
    return (
      <>
        <div className="face" style={{ background: b }} />
        <div
          className="face"
          style={{ background: a, clipPath: 'polygon(0 0, 100% 0, 0 100%)' }}
        />
      </>
    );
  }
  if (layout === 'shape') {
    // B as the field (~70%), A as a 60/30-style block over it.
    return (
      <>
        <div className="face" style={{ background: b }} />
        <div
          className="face"
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
      <div className="face" style={{ background: a, bottom: '50%' }} />
      <div className="face" style={{ background: b, top: '50%' }} />
    </>
  );
}

function lockPos(which: 'a' | 'b', layout: Layout): React.CSSProperties {
  if (layout === 'half') {
    return which === 'a' ? { left: 14, top: 14 } : { left: 14, bottom: 14 };
  }
  if (layout === 'diagonal') {
    return which === 'a' ? { left: 14, top: 14 } : { right: 14, bottom: 14 };
  }
  return which === 'a'
    ? { left: '22%', top: '24%' }
    : { right: 14, bottom: 14 };
}
