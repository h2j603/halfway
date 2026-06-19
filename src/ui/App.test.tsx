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

  it('the hue slider freely changes the selected color', () => {
    render(<App />);
    const before = readHexes()[0]; // color A (default selected)
    // Sliders in .controls are [hue, lightness, chroma]; drive hue far.
    const hue = document.querySelectorAll('.controls input[type="range"]')[0] as HTMLInputElement;
    fireEvent.change(hue, { target: { value: '20' } });
    const after = readHexes()[0];
    expect(after).not.toBe(before);
  });

  it('lightness can be pushed independently (full range, not locked to a base)', () => {
    render(<App />);
    const light = document.querySelectorAll('.controls input[type="range"]')[1] as HTMLInputElement;
    fireEvent.change(light, { target: { value: '0.1' } });
    const darkHex = readHexes()[0];
    fireEvent.change(light, { target: { value: '0.95' } });
    const lightHex = readHexes()[0];
    expect(darkHex).not.toBe(lightHex);
  });

  it('dragging a face changes that color directly', () => {
    render(<App />);
    const before = readHexes().join();
    const faceA = document.querySelector('[data-face="a"]')!;
    // Dispatch on the face so it bubbles to the field handler with target=faceA.
    fireEvent.pointerDown(faceA, { pointerId: 1, clientX: 400, clientY: 300 });
    fireEvent.pointerMove(faceA, { pointerId: 1, clientX: 560, clientY: 220 });
    fireEvent.pointerUp(faceA, { pointerId: 1, clientX: 560, clientY: 220 });
    expect(readHexes().join()).not.toBe(before);
  });

  it('selecting face B points the controls at the other color', () => {
    render(<App />);
    const toggleB = within(document.querySelector('.face-toggle') as HTMLElement).getByText(/^B /);
    fireEvent.click(toggleB);
    const beforeB = readHexes()[1];
    const hue = document.querySelectorAll('.controls input[type="range"]')[0] as HTMLInputElement;
    fireEvent.change(hue, { target: { value: '300' } });
    expect(readHexes()[1]).not.toBe(beforeB);
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

  it('+핀 flashes confirmation WITHOUT opening the panel', () => {
    render(<App />);
    fireEvent.click(screen.getByText('+ 핀'));
    // The panel stays closed; only a transient ＋ flash appears.
    expect(document.querySelector('.panel')!.className).not.toContain('open');
    expect(document.querySelector('.pin-flash')).not.toBeNull();
  });

  it('the pin shows up once the 핀 패널 is opened', () => {
    render(<App />);
    fireEvent.click(screen.getByText('+ 핀'));
    fireEvent.click(screen.getByText('핀 패널'));
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
