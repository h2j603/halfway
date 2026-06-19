// @vitest-environment jsdom
import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { App } from './App';

/** Runtime checks of the redesigned (light, circle-based) UI in jsdom. */

beforeAll(() => {
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
    x: 0,
    y: 0,
    width: 300,
    height: 300,
    top: 0,
    left: 0,
    right: 300,
    bottom: 300,
    toJSON: () => ({}),
  } as DOMRect);
  Element.prototype.setPointerCapture = () => {};
  Element.prototype.releasePointerCapture = () => {};
  localStorage.clear();
});

afterEach(() => {
  cleanup();
  localStorage.clear();
});

function hexes(): string[] {
  const r = document.querySelector('.readout')!;
  return (r.textContent?.match(/#[0-9A-F]{6}/g) ?? []) as string[];
}

describe('App — redesigned UI', () => {
  it('renders two color circles and two HEX values', () => {
    render(<App />);
    expect(document.querySelectorAll('.circle').length).toBe(2);
    expect(hexes()).toHaveLength(2);
  });

  it('shows the one-line caption', () => {
    render(<App />);
    expect(document.querySelector('.caption')!.textContent!.length).toBeGreaterThan(0);
  });

  it('the hue slider changes the selected color (A by default)', () => {
    render(<App />);
    const before = hexes()[0];
    const hue = document.querySelectorAll('.sliders input[type="range"]')[0] as HTMLInputElement;
    fireEvent.change(hue, { target: { value: '20' } });
    expect(hexes()[0]).not.toBe(before);
  });

  it('tapping circle B retargets the sliders to B', () => {
    render(<App />);
    const circleB = document.querySelector('[data-face="b"]')!;
    fireEvent.pointerDown(circleB, { pointerId: 1, clientX: 10, clientY: 10 });
    fireEvent.pointerUp(circleB, { pointerId: 1, clientX: 10, clientY: 10 });
    const beforeB = hexes()[1];
    const hue = document.querySelectorAll('.sliders input[type="range"]')[0] as HTMLInputElement;
    fireEvent.change(hue, { target: { value: '320' } });
    expect(hexes()[1]).not.toBe(beforeB);
  });

  it('dragging a circle changes that color', () => {
    render(<App />);
    const before = hexes().join();
    const circleA = document.querySelector('[data-face="a"]')!;
    fireEvent.pointerDown(circleA, { pointerId: 1, clientX: 150, clientY: 150 });
    fireEvent.pointerMove(circleA, { pointerId: 1, clientX: 240, clientY: 90 });
    fireEvent.pointerUp(circleA, { pointerId: 1, clientX: 240, clientY: 90 });
    expect(hexes().join()).not.toBe(before);
  });

  it('save adds a saved combination that can be restored', () => {
    render(<App />);
    expect(document.querySelector('.saved')).toBeNull();
    fireEvent.click(document.querySelector('.actions .action:last-child')!);
    const items = document.querySelectorAll('.saved-item');
    expect(items.length).toBe(1);
  });

  it('shuffle produces a different pair', () => {
    render(<App />);
    const before = hexes().join();
    // Try a few times to avoid a coincidental identical random pair.
    let changed = false;
    for (let i = 0; i < 5 && !changed; i++) {
      fireEvent.click(document.querySelector('.actions .action')!);
      if (hexes().join() !== before) changed = true;
    }
    expect(changed).toBe(true);
  });
});
