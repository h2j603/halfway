import { useEffect, useMemo, useState } from 'react';
import {
  nudgeColor,
  setColor,
  pairFromParams,
  caption,
  CHROMA_MAX,
  type Pair,
  type Oklch,
} from '../engine';
import { ColorField, type Layout } from './ColorField';
import { ColorControls } from './ColorControls';
import { Readout } from './Readout';
import { SpectrumStrip } from './SpectrumStrip';
import { PinPanel, type Pin } from './PinPanel';
import { Diagnosis } from './Diagnosis';

type Mode = 'edit' | 'dial' | 'diagnosis';

const LAYOUTS: Layout[] = ['half', 'diagonal', 'shape'];
const LAYOUT_LABEL: Record<Layout, string> = {
  half: '반반',
  diagonal: '대각선',
  shape: '도형 60·30',
};

/** Build a pair whose stimulation roughly equals `level` (0…1), for dial entry. */
function pairAtLevel(level: number, baseHue: number): Pair {
  return pairFromParams({
    baseLightness: 0.58,
    chroma: level * CHROMA_MAX,
    baseHue,
    hueDistance: level * 180,
    contrast: level * 0.7,
  });
}

const INITIAL_PAIR = pairAtLevel(0.5, 250);
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
  const [mode, setMode] = useState<Mode>('edit');
  const [pair, setPair] = useState<Pair>(INITIAL_PAIR);
  const [selected, setSelected] = useState<'a' | 'b'>('a');
  const [layout, setLayout] = useState<Layout>('half');
  const [panelOpen, setPanelOpen] = useState(false);
  const [pins, setPins] = useState<Pin[]>(loadPins);
  const [dialLevel, setDialLevel] = useState(0.5);

  // Pins persist across reloads.
  useEffect(() => {
    try {
      localStorage.setItem(PINS_KEY, JSON.stringify(pins));
    } catch {
      /* storage unavailable — pins stay in-memory only */
    }
  }, [pins]);

  const cap = useMemo(() => caption(pair), [pair]);

  // Direct face drag: move the dragged color's hue/lightness freely.
  function handleColorDrag(which: 'a' | 'b', delta: { hue: number; lightness: number }) {
    setPair((p) => nudgeColor(p, which, delta));
  }

  // Slider edits: set absolute hue/lightness/chroma on the selected color.
  function handleControlChange(patch: Partial<Oklch>) {
    setPair((p) => setColor(p, selected, patch));
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
    // Keep the current A hue as the base so the dial explores around the user's
    // chosen color family rather than always snapping back to blue.
    setPair((p) => pairAtLevel(level, p.a.h));
  }

  function randomizePair() {
    const baseHue = Math.floor(Math.random() * 360);
    setPair(pairAtLevel(0.45 + Math.random() * 0.25, baseHue));
  }

  return (
    <div className="app">
      <div className="stage">
        <div className="topbar">
          <div className="segmented" role="tablist" aria-label="모드">
            {(['edit', 'dial', 'diagnosis'] as Mode[]).map((m) => (
              <button
                key={m}
                role="tab"
                aria-pressed={mode === m}
                onClick={() => setMode(m)}
              >
                {m === 'edit' ? '편집' : m === 'dial' ? '다이얼' : '진단'}
              </button>
            ))}
          </div>
          <div className="topbar-right">
            <button className="ghost-btn" onClick={randomizePair} title="무작위 시작점">
              🎲 랜덤
            </button>
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
            selected={selected}
            onSelect={setSelected}
            onColorDrag={handleColorDrag}
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
              <div className="hint-mono">
                자극 {Math.round(dialLevel * 100)}% — 이후 색면을 끌어 자유롭게 다듬으세요
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

        <ColorControls
          pair={pair}
          selected={selected}
          onSelect={setSelected}
          onChange={handleControlChange}
        />

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
