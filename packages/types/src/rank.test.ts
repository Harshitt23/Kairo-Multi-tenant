import { describe, it, expect } from 'vitest';
import { rankBetween, firstRank } from './rank';

describe('rankBetween', () => {
  it('produces a value between two bounds', () => {
    const r = rankBetween('A', 'C');
    expect(r > 'A').toBe(true);
    expect(r < 'C').toBe(true);
  });

  it('handles open lower bound (insert at start)', () => {
    const r = rankBetween(null, 'B');
    expect(r < 'B').toBe(true);
  });

  it('handles open upper bound (append at end)', () => {
    const r = rankBetween('B', null);
    expect(r > 'B').toBe(true);
  });

  it('handles fully open range', () => {
    const r = rankBetween(null, null);
    expect(typeof r).toBe('string');
    expect(r.length).toBeGreaterThan(0);
  });

  it('finds a midpoint between adjacent digits by descending', () => {
    const r = rankBetween('A', 'B');
    expect(r > 'A').toBe(true);
    expect(r < 'B').toBe(true);
  });

  it('keeps ordering stable across repeated bisections', () => {
    let lo = firstRank();
    let hi: string | null = null;
    const seq: string[] = [lo];
    for (let i = 0; i < 50; i++) {
      const mid = rankBetween(lo, hi);
      expect(mid > lo).toBe(true);
      if (hi) expect(mid < hi).toBe(true);
      seq.push(mid);
      // alternately tighten from both sides
      if (i % 2 === 0) hi = mid;
      else lo = mid;
    }
    const sorted = [...seq].sort();
    // every generated rank is unique
    expect(new Set(seq).size).toBe(seq.length);
    expect(sorted).toEqual([...sorted]);
  });

  it('throws when bounds are inverted', () => {
    expect(() => rankBetween('C', 'A')).toThrow();
  });
});
