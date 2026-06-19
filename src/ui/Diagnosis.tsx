import { useState } from 'react';
import {
  hexToOklch,
  oklchToHex,
  suggestAdjustments,
  oklchToCss,
  type Pair,
} from '../engine';

interface Props {
  pair: Pair;
  onSeed: (pair: Pair) => void;
  onApply: (pair: Pair) => void;
}

const HEX_RE = /^#?[0-9a-fA-F]{6}$/;

/**
 * Diagnosis mode UI: the user types their two colors (seeding the preview),
 * and we surface labelled, non-random prescriptions from suggestAdjustments.
 */
export function Diagnosis({ pair, onSeed, onApply }: Props) {
  const [inA, setInA] = useState(oklchToHex(pair.a));
  const [inB, setInB] = useState(oklchToHex(pair.b));

  function seed() {
    if (!HEX_RE.test(inA) || !HEX_RE.test(inB)) return;
    onSeed({ a: hexToOklch(inA), b: hexToOklch(inB) });
  }

  const suggestions = suggestAdjustments(pair);

  return (
    <div className="float-card diagnosis">
      <h4>진단 — 두 색을 입력하면 이론에 맞는 보정을 제안합니다</h4>
      <div className="diag-inputs">
        <input
          value={inA}
          onChange={(e) => setInA(e.target.value)}
          onBlur={seed}
          onKeyDown={(e) => e.key === 'Enter' && seed()}
          spellCheck={false}
          aria-label="색 A"
        />
        <input
          value={inB}
          onChange={(e) => setInB(e.target.value)}
          onBlur={seed}
          onKeyDown={(e) => e.key === 'Enter' && seed()}
          spellCheck={false}
          aria-label="색 B"
        />
        <button className="ghost-btn" onClick={seed}>
          진단
        </button>
      </div>
      <div className="diag-cards">
        {suggestions.map((s, i) => (
          <button className="diag-card" key={i} onClick={() => onApply(s.result)}>
            <span className="preview">
              <span style={{ background: oklchToCss(s.result.a) }} />
              <span style={{ background: oklchToCss(s.result.b) }} />
            </span>
            <span className="body">
              <span className="title">{s.label}</span>
              <span className="why">{s.why}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
