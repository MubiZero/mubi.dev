import { describe, expect, it } from 'vitest';
import snapshot from '../../src/data/github-contributions.json';

const DAY_MS = 24 * 60 * 60 * 1000;

describe('the committed contribution snapshot', () => {
  it('covers exactly the days between its own bounds', () => {
    const from = Date.parse(`${snapshot.from}T00:00:00Z`);
    const to = Date.parse(`${snapshot.to}T00:00:00Z`);
    expect(Number.isNaN(from)).toBe(false);
    expect(Number.isNaN(to)).toBe(false);
    expect(snapshot.levels.length).toBe((to - from) / DAY_MS + 1);
  });

  it('holds only levels the stylesheet can paint', () => {
    expect(snapshot.levels).toMatch(/^[0-4]+$/);
  });

  it('carries one count per day, so any window can state its own total', () => {
    expect(snapshot.counts.length).toBe(snapshot.levels.length);
    expect(snapshot.counts.every((count) => Number.isInteger(count) && count >= 0)).toBe(true);
  });

  it('agrees with itself: the stated total is the sum of the days', () => {
    expect(snapshot.counts.reduce((sum, count) => sum + count, 0)).toBe(snapshot.total);
  });

  it('marks a day as active exactly when it has contributions', () => {
    [...snapshot.levels].forEach((level, index) => {
      expect(level === '0', `day ${index}`).toBe(snapshot.counts[index] === 0);
    });
  });

  it('spans about a year, so the caption is not claiming more than it shows', () => {
    expect(snapshot.levels.length).toBeGreaterThan(360);
    expect(snapshot.levels.length).toBeLessThan(372);
  });
});
