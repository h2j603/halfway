import { useMemo } from 'react';
import { generateCandidates, oklchToCss, type Pair } from '../engine';

interface Props {
  anchor: Pair;
  onPick: (pair: Pair) => void;
}

/**
 * The "비슷한 자극의 다른 후보" strip — same-energy alternatives to the current
 * pair, sorted by hue distance so the strip reads as a smooth sweep.
 */
export function SpectrumStrip({ anchor, onPick }: Props) {
  // Keep the strip small — a handful of nearby options, not an overwhelming row.
  const candidates = useMemo(() => generateCandidates(anchor, 5, 0.07), [anchor]);

  return (
    <div className="spectrum">
      <div className="spectrum-label">비슷한 자극의 다른 후보</div>
      <div className="spectrum-track">
        {candidates.map((c, i) => {
          const isAnchor =
            JSON.stringify(c.pair) === JSON.stringify(anchor);
          return (
            <button
              key={i}
              className={`spectrum-cell${isAnchor ? ' is-anchor' : ''}`}
              onClick={() => onPick(c.pair)}
              title={`자극 ${(c.stimulation * 100).toFixed(0)}%`}
            >
              <span className="half" style={{ background: oklchToCss(c.pair.a) }} />
              <span className="half" style={{ background: oklchToCss(c.pair.b) }} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
