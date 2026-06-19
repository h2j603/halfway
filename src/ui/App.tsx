import { useEffect, useMemo, useState } from 'react';
import {
  adjustStimulation,
  adjustHueDistance,
  adjustContrast,
  pairFromParams,
  caption,
  STEPS,
  CHROMA_MAX,
  type Pair,
  type Lock,
} from '../engine';
import { ColorField, type Layout } from './ColorField';
import { Readout } from './Readout';
import { SpectrumStrip } from './SpectrumStrip';
import { PinPanel, type Pin } from './PinPanel';
import { Diagnosis } from './Diagnosis';

type Mode = 'dial' | 'fixed' | 'diagnosis';

const LAYOUTS: Layout[] = ['half', 'diagonal', 'shape'];
const LAYOUT_LABEL: Record<Layout, string> = {
  half: '반반',
  diagonal: '대각선',
  shape: '도형 60·30',
};

/** Build a pair whose stimulation roughly equals `level` (0…1), for dial entry. */
function pairAtLevel(level: number, baseHue = 250): Pair {
  return pairFromParams({
    baseLightness: 0.58,
    chroma: level * CHROMA_MAX,
    baseHue,
    hueDistance: level * 180,
    contrast: level * 0.7,
  });
}

const INITIAL_PAIR = pairAtLevel(0.5);
const PINS_KEY = 'halfway.pins.v1';

function loadPins(): Pin[] {
  try {
    const raw = localStorage.getItem(PINS_KEY);
    return raw ? (JSON.parse(raw) as Pin[]) : [];
  } catch {
    return [];
  }
}

export function App() {
  const [mode, setMode] = useState<Mode>('dial');
  const [pair, setPair] = useState<Pair>(INITIAL_PAIR);
  const [lock, setLock] = useState<Lock>('a');
  const [layout, setLayout] = useState<Layout>('half');
  const [panelOpen, setPanelOpen] = useState(false);
  const [pins, setPins] = useState<Pin[]>(loadPins);
  const [dialLevel, setDialLevel] = useState(0.5);

  // Pins persist across reloads (spec keeps a pin tray; losing it on refresh
  // would defeat the point of collecting combinations).
  useEffect(() => {
    try {
      localStorage.setItem(PINS_KEY, JSON.stringify(pins));
    } catch {
      /* storage unavailable — pins stay in-memory only */
    }
  }, [pins]);

  const activeLock: Lock = mode === 'fixed' ? lock : null;
  const cap = useMemo(() => caption(pair), [pair]);

  function handleDrag({ chroma, hue }: { chroma: number; hue: number }) {
    setPair((p) => {
      let next = adjustStimulation(p, chroma * STEPS.chroma, activeLock);
      next = adjustHueDistance(next, hue * STEPS.hue, activeLock);
      return next;
    });
  }

  function bumpContrast(dir: 1 | -1) {
    setPair((p) => adjustContrast(p, dir * STEPS.contrast, activeLock));
  }

  function cycleLayout() {
    setLayout((l) => LAYOUTS[(LAYOUTS.indexOf(l) + 1) % LAYOUTS.length]);
  }

  function addPin() {
    setPins((ps) => [{ id: Date.now(), pair }, ...ps]);
    setPanelOpen(true);
  }

  function onDialChange(level: number) {
    setDialLevel(level);
    setPair(pairAtLevel(level));
  }

  return (
    <div className="app">
      <div className="stage">
        <div className="topbar">
          <div className="segmented" role="tablist" aria-label="진입 모드">
            {(['dial', 'fixed', 'diagnosis'] as Mode[]).map((m) => (
              <button
                key={m}
                role="tab"
                aria-pressed={mode === m}
                onClick={() => setMode(m)}
              >
                {m === 'dial' ? '다이얼' : m === 'fixed' ? '고정' : '진단'}
              </button>
            ))}
          </div>
          <div className="topbar-right">
            <button className="ghost-btn" onClick={cycleLayout}>
              레이아웃 · {LAYOUT_LABEL[layout]}
            </button>
            <button className="ghost-btn" onClick={addPin}>
              + 핀
            </button>
            <button
              className="ghost-btn"
              onClick={() => setPanelOpen((o) => !o)}
              aria-pressed={panelOpen}
            >
              핀 패널
            </button>
          </div>
        </div>

        <div className="field-wrap">
          <ColorField
            pair={pair}
            layout={layout}
            lock={activeLock}
            onDrag={handleDrag}
            onLockToggle={(which) => setLock(which)}
          />

          {mode === 'dial' && (
            <div className="float-card">
              <h4>다이얼 — 자극 레벨만 정하고 출발</h4>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={dialLevel}
                onChange={(e) => onDialChange(Number(e.target.value))}
                style={{ width: '100%' }}
                aria-label="자극 레벨"
              />
              <div
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 11,
                  color: 'var(--ink-dim)',
                  marginTop: 4,
                }}
              >
                자극 {Math.round(dialLevel * 100)}% — 이후 색면을 드래그해 다듬으세요
              </div>
            </div>
          )}

          {mode === 'diagnosis' && (
            <Diagnosis pair={pair} onSeed={setPair} onApply={setPair} />
          )}

          <div className="overlay">
            <Readout pair={pair} layout={layout} />
            <div className={`caption${cap.warning ? ' warn' : ''}`}>{cap.text}</div>
          </div>
        </div>

        <div className="contrast-row">
          <button className="pill" onClick={() => bumpContrast(-1)}>
            대비 −
          </button>
          <span className="label">명암대비</span>
          <button className="pill" onClick={() => bumpContrast(1)}>
            대비 +
          </button>
        </div>

        <SpectrumStrip anchor={pair} onPick={setPair} />
      </div>

      <PinPanel
        open={panelOpen}
        pins={pins}
        onClose={() => setPanelOpen(false)}
        onApply={setPair}
        onRemove={(id) => setPins((ps) => ps.filter((p) => p.id !== id))}
      />
    </div>
  );
}
