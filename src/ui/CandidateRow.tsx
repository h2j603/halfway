import { useMemo } from 'react';
import { generateCandidates, oklchToCss, type Pair } from '../engine';

interface Props {
  anchor: Pair;
  onPick: (pair: Pair) => void;
}

/** A few same-energy alternatives to the current pair (tap to use). */
export function CandidateRow({ anchor, onPick }: Props) {
  const cands = useMemo(() => generateCandidates(anchor, 5, 0.08), [anchor]);
  return (
    <div className="candidates">
      <div className="candidates-label">비슷한 조합</div>
      <div className="candidate-row">
        {cands.map((c, i) => (
          <button
            key={i}
            className="candidate"
            onClick={() => onPick(c.pair)}
            aria-label="이 조합 사용"
          >
            <span style={{ background: oklchToCss(c.pair.a) }} />
            <span style={{ background: oklchToCss(c.pair.b) }} />
          </button>
        ))}
      </div>
    </div>
  );
}
