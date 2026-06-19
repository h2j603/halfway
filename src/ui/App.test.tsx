// @vitest-environment jsdom
import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import { App } from './App';

/**
 * Runtime verification of the UI in jsdom — the closest we can get to a real
 * browser given the sandbox blocks Chromium downloads. Mounts the real App,
 * drives the real handlers, and asserts the engine output reaches the DOM.
 */

beforeAll(() => {
  // jsdom gives elements a 0×0 box; the drag math divides by it. Give the field
  // a realistic size so drag deltas are finite.
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
    x: 0,
    y: 0,
    width: 800,
    height: 600,
    top: 0,
    left: 0,
    right: 800,
    bottom: 600,
    toJSON: () => ({}),
  } as DOMRect);
  // Pointer capture isn't implemented in jsdom.
  Element.prototype.setPointerCapture = () => {};
  Element.prototype.releasePointerCapture = () => {};
});

afterEach(cleanup);

/** Extract the two HEX codes currently shown in the resident readout. */
function readHexes(): string[] {
  const readout = document.querySelector('.readout')!;
  return (readout.textContent?.match(/#[0-9A-F]{6}/g) ?? []) as string[];
}

/** Current WCAG ratio shown in the readout, e.g. "4.21:1" → 4.21. */
function readRatio(): number {
  const m = document.querySelector('.readout')!.textContent?.match(/([\d.]+):1/);
  return m ? Number(m[1]) : NaN;
}

describe('App — runtime smoke', () => {
  it('mounts and shows two distinct HEX values in the readout', () => {
    render(<App />);
    const hexes = readHexes();
    expect(hexes).toHaveLength(2);
    expect(hexes[0]).not.toBe(hexes[1]);
  });

  it('shows an always-on status caption', () => {
    render(<App />);
    expect(document.querySelector('.caption')!.textContent!.length).toBeGreaterThan(0);
  });

  it('contrast + button widens the WCAG ratio', () => {
    render(<App />);
    const before = readRatio();
    fireEvent.click(screen.getByText('대비 +'));
    fireEvent.click(screen.getByText('대비 +'));
    expect(readRatio()).toBeGreaterThan(before);
  });

  it('dragging the field changes the colors', () => {
    render(<App />);
    const before = readHexes().join();
    const field = document.querySelector('.field')!;
    fireEvent.pointerDown(field, { pointerId: 1, clientX: 400, clientY: 300 });
    fireEvent.pointerMove(field, { pointerId: 1, clientX: 520, clientY: 160 });
    fireEvent.pointerUp(field, { pointerId: 1, clientX: 520, clientY: 160 });
    expect(readHexes().join()).not.toBe(before);
  });

  it('diagnosis mode surfaces labelled prescription cards', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('tab', { name: '진단' }));
    const cards = document.querySelectorAll('.diag-card');
    expect(cards.length).toBeGreaterThan(0);
    // Every card carries a non-empty title and "why" — the differentiator.
    cards.forEach((card) => {
      expect(card.querySelector('.title')!.textContent!.length).toBeGreaterThan(0);
      expect(card.querySelector('.why')!.textContent!.length).toBeGreaterThan(0);
    });
  });

  it('pinning adds an entry to the side panel', () => {
    render(<App />);
    fireEvent.click(screen.getByText('+ 핀'));
    const panel = document.querySelector('.panel')!;
    expect(panel.className).toContain('open');
    expect(within(panel as HTMLElement).getAllByText(/#[0-9A-F]{6}/i).length).toBeGreaterThan(0);
  });

  it('cycling layout updates the area-ratio readout for the shape view', () => {
    render(<App />);
    const btn = screen.getByText(/레이아웃 ·/);
    // half → diagonal → shape
    fireEvent.click(btn); // diagonal
    fireEvent.click(btn); // shape
    expect(document.querySelector('.readout')!.textContent).toContain('60 / 30');
  });
});
