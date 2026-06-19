# Halfway — 2색 조합 컬러 툴 (v1)

색 조합을 추상 수치가 아니라 **결과 색면을 직접 밀어서** 만드는 작업 도구.
두 색의 조합을 **자극량(stimulation)** 이라는 하나의 체감 척도로 다룬다 —
자극량은 **채도 · 색상거리 · 명암대비** 세 축의 함수다.

> Ruxandra Duru의 두 글(“Two-Color Combinations: A Toolkit”, “Halfway color
> combinations”)의 색 이론을 인터랙티브 도구로 옮긴 것.

## 빠른 시작

```bash
npm install
npm run dev        # 개발 서버 (http://localhost:5173)
npm test           # 엔진 단위 테스트 (vitest)
npm run build      # 타입체크 + 프로덕션 빌드
```

## 아키텍처

엔진(순수 함수)과 UI(React)가 분리되어 있다. 스펙의 핵심 원칙대로
**엔진을 먼저 단단히 못 박고** 그 위에 UI를 올렸다.

### 엔진 — `src/engine/` (UI 없이 단독으로 검증됨)

| 파일 | 역할 |
|------|------|
| `color.ts` | OKLCH ↔ HEX 변환 · WCAG 대비비 (culori 위임, gamut 처리) |
| `stimulation.ts` | `stimulation()` = 가중 f(채도, 색상거리, 명암대비) |
| `vibrating.ts` | `isVibrating()` — 먼 색상 + 비슷한 OKLCH 명도 + 고채도 |
| `suggest.ts` | `suggestAdjustments()` — **라벨 붙은** 보정 제안 (무작위 금지) |
| `candidates.ts` | `generateCandidates()` — 같은 자극의 다른 후보 |
| `caption.ts` | 상태 자막 매핑 (자극 구간 → 형용사) |
| `manipulate.ts` | 드래그/버튼이 쓰는 순수 조작 함수 (`고정` 모드용 lock 지원) |
| `constants.ts` | 가중치·임계값·스텝 — **튜닝 지점 단일 출처** |

> **왜 OKLCH인가:** HSL의 L로는 노랑/보라의 본질 명도 차가 안 잡혀 vibrating
> 탐지가 오탐한다. 지각적 명도가 필요해 OKLCH가 필수다. 테스트
> `does NOT flag yellow/violet`가 이 함정을 직접 검증한다.

### UI — `src/ui/`

| 파일 | 역할 |
|------|------|
| `App.tsx` | 상태 소유 · 세 진입 모드 · 레이아웃/핀 조율 |
| `ColorField.tsx` | 색면(화면의 주인공). 드래그 2축 + 레이아웃 3종(**뷰 전용**) |
| `Readout.tsx` | HEX(클릭 복사) · 대비비 · 면적비율, 작게 상주 |
| `SpectrumStrip.tsx` | 비슷한 자극의 다른 후보 띠 |
| `Diagnosis.tsx` | 진단 입력 + 처방 카드 |
| `PinPanel.tsx` | 핀 측면 패널 |

## 조작 ↔ 자극 축 매핑

세 입력 컨트롤이 자극량의 세 축에 일대일로 대응한다:

- **세로 드래그** → 채도(자극 강도) `adjustStimulation`
- **가로 드래그** → 색상거리 `adjustHueDistance`
- **하단 버튼** → 명암대비 `adjustContrast`

`stimulation()`은 이 셋의 합성값을 읽어 자막으로 표시한다.

## 세 진입 모드

- **다이얼** — 시작점 없이 자극 레벨만 정하고 출발
- **고정** — 한 색을 잠그고(자물쇠) 나머지만 탐색
- **진단** — 내 두 색을 입력 → 이론에 맞는 보정 제안

세 모드 모두 동일한 코어 함수·동일한 결과 화면을 공유한다.

## v1 범위 밖 (의도적 보류)

3색/N색, 제3색 추천, CSS/PNG/JSON 내보내기(현재 HEX 복사만), Are.na 연동,
면적 비율 정교화. 자극량 이론이 2색 전용이라 확장은 별도 이론 설계가 필요하다.
