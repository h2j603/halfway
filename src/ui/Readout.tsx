import { useState } from 'react';
import { oklchToHex, contrastRatio, type Pair } from '../engine';

/** Ratio label for the current layout (60/30 for the shape view, else 50/50). */
function ratioLabel(layout: string): string {
  return layout === 'shape' ? '60 / 30' : '50 / 50';
}

interface Props {
  pair: Pair;
  layout: string;
}

/**
 * Always-resident readout: HEX (click to copy) · WCAG contrast ratio · area
 * ratio. Small, in the corner, so it never crowds the color faces.
 */
export function Readout({ pair, layout }: Props) {
  const [copied, setCopied] = useState<string | null>(null);
  const hexA = oklchToHex(pair.a);
  const hexB = oklchToHex(pair.b);
  const ratio = contrastRatio(pair.a, pair.b);

  async function copy(hex: string) {
    try {
      await navigator.clipboard.writeText(hex);
      setCopied(hex);
      setTimeout(() => setCopied((c) => (c === hex ? null : c)), 1100);
    } catch {
      /* clipboard blocked — ignore silently */
    }
  }

  return (
    <div className="readout" role="status">
      <span
        className="hex"
        onClick={() => copy(hexA)}
        title="클릭하여 복사"
      >
        <span className="swatch" style={{ background: hexA }} />
        {copied === hexA ? <span className="copied-toast">복사됨</span> : hexA}
      </span>
      <span className="sep">·</span>
      <span
        className="hex"
        onClick={() => copy(hexB)}
        title="클릭하여 복사"
      >
        <span className="swatch" style={{ background: hexB }} />
        {copied === hexB ? <span className="copied-toast">복사됨</span> : hexB}
      </span>
      <span className="sep">·</span>
      <span title="WCAG 대비비">{ratio.toFixed(2)}:1</span>
      <span className="sep">·</span>
      <span title="면적 비율">{ratioLabel(layout)}</span>
    </div>
  );
}
