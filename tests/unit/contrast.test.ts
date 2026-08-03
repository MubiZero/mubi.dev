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
    0.2126 * channelToLinear(r) +
    0.7152 * channelToLinear(g) +
    0.0722 * channelToLinear(b)
  );
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe('dark theme', () => {
  const bg = token("[data-theme='dark']", '--bg');

  it('primary text meets 4.5:1', () => {
    expect(contrast(token("[data-theme='dark']", '--text'), bg)).toBeGreaterThanOrEqual(4.5);
  });

  it('secondary text meets 4.5:1', () => {
    expect(contrast(token("[data-theme='dark']", '--text-muted'), bg)).toBeGreaterThanOrEqual(4.5);
  });

  it('accent text meets 4.5:1', () => {
    expect(contrast(token("[data-theme='dark']", '--accent-strong'), bg)).toBeGreaterThanOrEqual(4.5);
  });

  it('focus ring meets 3:1 as non-text UI', () => {
    expect(contrast(token("[data-theme='dark']", '--focus'), bg)).toBeGreaterThanOrEqual(3);
  });
});

describe('light theme', () => {
  const bg = token(":root,\n[data-theme='light']", '--bg');

  it('primary text meets 4.5:1', () => {
    expect(contrast(token(":root,\n[data-theme='light']", '--text'), bg)).toBeGreaterThanOrEqual(4.5);
  });

  it('secondary text meets 4.5:1', () => {
    expect(contrast(token(":root,\n[data-theme='light']", '--text-muted'), bg)).toBeGreaterThanOrEqual(4.5);
  });

  it('accent text meets 4.5:1', () => {
    expect(contrast(token(":root,\n[data-theme='light']", '--accent-strong'), bg)).toBeGreaterThanOrEqual(4.5);
  });

  it('focus ring meets 3:1 as non-text UI', () => {
    expect(contrast(token(":root,\n[data-theme='light']", '--focus'), bg)).toBeGreaterThanOrEqual(3);
  });
});
