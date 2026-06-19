import { oklchToHex, type Pair } from '../engine';

export interface Pin {
  id: number;
  pair: Pair;
}

interface Props {
  open: boolean;
  pins: Pin[];
  onClose: () => void;
  onApply: (pair: Pair) => void;
  onRemove: (id: number) => void;
}

/** Side panel (펼치기) holding pinned pairs. */
export function PinPanel({ open, pins, onClose, onApply, onRemove }: Props) {
  return (
    <aside className={`panel${open ? ' open' : ''}`} aria-hidden={!open}>
      <div className="panel-inner">
        <div className="panel-head">
          <span>핀 ({pins.length})</span>
          <button className="mini" onClick={onClose} aria-label="패널 닫기">
            ✕
          </button>
        </div>
        {pins.length === 0 ? (
          <p className="panel-empty">
            마음에 드는 조합을 핀으로 모아두세요. 핀을 누르면 그 조합으로
            돌아갑니다.
          </p>
        ) : (
          <ul className="panel-list">
            {pins.map((pin) => {
              const hexA = oklchToHex(pin.pair.a);
              const hexB = oklchToHex(pin.pair.b);
              return (
                <li className="pin" key={pin.id}>
                  <button
                    className="pin-swatches"
                    onClick={() => onApply(pin.pair)}
                    title="이 조합 불러오기"
                    style={{ border: 0, padding: 0 }}
                  >
                    <span style={{ background: hexA }} />
                    <span style={{ background: hexB }} />
                  </button>
                  <span className="pin-hex">
                    {hexA}
                    <br />
                    {hexB}
                  </span>
                  <button
                    className="mini"
                    onClick={() => onRemove(pin.id)}
                    aria-label="핀 제거"
                  >
                    ✕
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
