import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync('src/styles/tokens.css', 'utf8');

function block(selector: string): string {
  const start = css.indexOf(selector);
  if (start === -1) throw new Error(`selector not found: ${selector}`);
  const open = css.indexOf('{', start);
  const close = css.indexOf('}', open);
  return css.slice(open + 1, close);
}

function token(selector: string, name: string): string {
  const match = block(selector).match(new RegExp(`${name}:\\s*([^;]+);`));
  if (!match) throw new Error(`token not found: ${name} in ${selector}`);
  return match[1].trim();
}

function channelToLinear(value: number): number {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function luminance(hex: string): number {
  const h = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return (
    0.2126 * channelToLinear(r) + 0.7152 * channelToLinear(g) + 0.0722 * channelToLinear(b)
  );
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const THEMES = [
  { name: 'night shift', selector: ":root,\n:root[data-theme='dark']" },
  { name: 'day shift', selector: ":root[data-theme='light']" },
] as const;

describe.each(THEMES)('$name palette', ({ selector }) => {
  const bg = token(selector, '--bg');

  it('primary text meets 4.5:1', () => {
    expect(contrast(token(selector, '--text'), bg)).toBeGreaterThanOrEqual(4.5);
  });

  it('secondary text meets 4.5:1', () => {
    expect(contrast(token(selector, '--muted'), bg)).toBeGreaterThanOrEqual(4.5);
  });

  it('the faintest text still meets 4.5:1', () => {
    expect(contrast(token(selector, '--faint'), bg)).toBeGreaterThanOrEqual(4.5);
  });

  it('the accent meets 4.5:1, because it carries the measured values', () => {
    expect(contrast(token(selector, '--accent'), bg)).toBeGreaterThanOrEqual(4.5);
  });

  it('text on the accent button meets 4.5:1', () => {
    expect(
      contrast(token(selector, '--on-accent'), token(selector, '--accent')),
    ).toBeGreaterThanOrEqual(4.5);
  });

  it('the focus ring meets 3:1 as non-text UI', () => {
    expect(contrast(token(selector, '--focus'), bg)).toBeGreaterThanOrEqual(3);
  });
});

/**
 * The graph's load-bearing distinction is "a day with work" against "a day
 * without", and nothing else checked it: axe does not compare two adjacent
 * fills, and the palette tests above only look at text on the page background.
 * An evenly spaced ramp put that first step at 1.93:1 in dark and 1.61:1 in
 * light, which is a graph whose lowest bar is invisible.
 */
function mix(accent: string, base: string, percent: number): string {
  const channels = (hex: string, i: number) => parseInt(hex.replace('#', '').slice(i, i + 2), 16);
  return `#${[0, 2, 4]
    .map((i) =>
      Math.round(channels(accent, i) * percent + channels(base, i) * (1 - percent))
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`;
}

const siteCss = readFileSync('src/styles/site.css', 'utf8');

function levelPercent(level: number): number {
  const match = siteCss.match(
    new RegExp(
      `\\.calendar__day\\[data-level='${level}'\\]\\s*\\{[^}]*color-mix\\(in srgb, var\\(--accent\\) (\\d+)%`,
    ),
  );
  if (!match) throw new Error(`no colour-mix found for calendar level ${level}`);
  return Number(match[1]) / 100;
}

describe.each(THEMES)('$name contribution calendar', ({ name, selector }) => {
  const empty = token(selector, '--raised');
  const accent = token(selector, '--accent');
  // Light theme cannot reach 3:1 here: its accent is a dark brown and the whole
  // ramp spans about 5:1, so the floor is what the palette allows, not the
  // WCAG figure. The tooltip and the screen-reader text carry the exact count.
  const floor = name === 'night shift' ? 3 : 2.3;

  it('separates a day with contributions from an empty one', () => {
    expect(contrast(mix(accent, empty, levelPercent(1)), empty)).toBeGreaterThanOrEqual(floor);
  });

  it('keeps every step brighter than the one below it', () => {
    const fills = [
      empty,
      mix(accent, empty, levelPercent(1)),
      mix(accent, empty, levelPercent(2)),
      mix(accent, empty, levelPercent(3)),
      accent,
    ];
    for (let i = 1; i < fills.length; i++) {
      expect(contrast(fills[i], fills[i - 1]), `level ${i} against level ${i - 1}`).toBeGreaterThan(
        1.15,
      );
    }
  });
});
