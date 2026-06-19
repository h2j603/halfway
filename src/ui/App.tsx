import { useEffect, useMemo, useState } from 'react';
import {
  nudgeColor,
  setColor,
  pairFromParams,
  caption,
  stimulation,
  bandOf,
  suggestAdjustments,
  oklchToHex,
  oklchToCss,
  CENTRAL_BAND,
  CHROMA_MAX,
  type Pair,
  type Oklch,
} from '../engine';
import { CircleField } from './CircleField';
import { Sliders } from './Sliders';
import { CandidateRow } from './CandidateRow';

interface Saved {
  id: number;
  pair: Pair;
}

const SAVED_KEY = 'halfway.saved.v1';

function randomPair(): Pair {
  const hue = Math.floor(Math.random() * 360);
  const level = 0.4 + Math.random() * 0.3;
  return pairFromParams({
    baseLightness: 0.5 + Math.random() * 0.18,
    chroma: 0.08 + level * (CHROMA_MAX - 0.08),
    baseHue: hue,
    hueDistance: 40 + Math.random() * 130,
    contrast: 0.15 + Math.random() * 0.4,
  });
}

const INITIAL = pairFromParams({
  baseLightness: 0.62,
  chroma: 0.12,
  baseHue: 250,
  hueDistance: 90,
  contrast: 0.22,
});

function loadSaved(): Saved[] {
  try {
    const raw = localStorage.getItem(SAVED_KEY);
    return raw ? (JSON.parse(raw) as Saved[]) : [];
  } catch {
    return [];
  }
}

const BAND_WORD = { low: '잔잔함', central: '딱 맞음', high: '강렬함' } as const;

export function App() {
  const [pair, setPair] = useState<Pair>(INITIAL);
  const [selected, setSelected] = useState<'a' | 'b'>('a');
  const [saved, setSaved] = useState<Saved[]>(loadSaved);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(SAVED_KEY, JSON.stringify(saved));
    } catch {
      /* ignore */
    }
  }, [saved]);

  const cap = useMemo(() => caption(pair), [pair]);
  const stim = useMemo(() => stimulation(pair.a, pair.b), [pair]);
  const band = bandOf(stim.value);
  const suggestion = useMemo(() => suggestAdjustments(pair)[0], [pair]);
  const showFix = cap.warning || band !== 'central';

  const hexA = oklchToHex(pair.a);
  const hexB = oklchToHex(pair.b);
  const cssA = oklchToCss(pair.a);
  const cssB = oklchToCss(pair.b);

  function onColorDrag(which: 'a' | 'b', delta: { hue: number; lightness: number }) {
    setPair((p) => nudgeColor(p, which, delta));
  }
  function onSliderChange(patch: Partial<Oklch>) {
    setPair((p) => setColor(p, selected, patch));
  }
  async function copy(hex: string) {
    try {
      await navigator.clipboard.writeText(hex);
      setCopied(hex);
      setTimeout(() => setCopied((c) => (c === hex ? null : c)), 1100);
    } catch {
      /* clipboard blocked */
    }
  }
  function save() {
    setSaved((s) => [{ id: Date.now(), pair }, ...s].slice(0, 12));
  }

  return (
    <div className="app">
      <div className="wordmark">Halfway</div>

      <CircleField pair={pair} selected={selected} onSelect={setSelected} onColorDrag={onColorDrag} />

      <div className="readout">
        <button className="hex" onClick={() => copy(hexA)} title="복사">
          <span className="dot" style={{ background: hexA }} />
          {copied === hexA ? <span className="copied">복사됨</span> : hexA}
        </button>
        <span className="sep">·</span>
        <button className="hex" onClick={() => copy(hexB)} title="복사">
          <span className="dot" style={{ background: hexB }} />
          {copied === hexB ? <span className="copied">복사됨</span> : hexB}
        </button>
      </div>

      {/* Stimulation meter — the core concept, made visible. */}
      <div className="meter">
        <div className="meter-track">
          <div
            className="meter-band"
            style={{
              left: `${CENTRAL_BAND.low * 100}%`,
              width: `${(CENTRAL_BAND.high - CENTRAL_BAND.low) * 100}%`,
            }}
          />
          <div className="meter-marker" style={{ left: `${stim.value * 100}%` }} />
        </div>
        <div className="meter-label">
          <span>자극 {Math.round(stim.value * 100)}</span>
          <span>{BAND_WORD[band]}</span>
        </div>
      </div>

      <div className={`caption${cap.warning ? ' warn' : ''}`}>{cap.text}</div>

      {showFix && (
        <button className="fix-chip" onClick={() => setPair(suggestion.result)}>
          ✨ {suggestion.label}
        </button>
      )}

      <Sliders which={selected} color={pair[selected]} onChange={onSliderChange} />

      {/* The pair in use — see how the two colors actually read together. */}
      <div className="preview" style={{ background: cssB }}>
        <div className="preview-title" style={{ color: cssA }}>
          가나다 Aa Bb
        </div>
        <div className="preview-text" style={{ color: cssA }}>
          두 색이 함께 쓰일 때 이렇게 보입니다.
        </div>
        <div className="preview-chip" style={{ background: cssA, color: cssB }}>
          버튼
        </div>
      </div>

      <CandidateRow anchor={pair} onPick={setPair} />

      <div className="actions">
        <button className="action" onClick={() => setPair(randomPair())}>
          🎲 다른 조합
        </button>
        <button className="action" onClick={save}>
          ♥ 저장
        </button>
      </div>

      {saved.length > 0 && (
        <div className="saved">
          {saved.map((s) => (
            <span className="saved-item" key={s.id}>
              <button className="mini" onClick={() => setPair(s.pair)} aria-label="저장한 조합 불러오기">
                <span style={{ background: oklchToHex(s.pair.a) }} />
                <span style={{ background: oklchToHex(s.pair.b) }} />
              </button>
              <button
                className="rm"
                onClick={() => setSaved((arr) => arr.filter((x) => x.id !== s.id))}
                aria-label="삭제"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
