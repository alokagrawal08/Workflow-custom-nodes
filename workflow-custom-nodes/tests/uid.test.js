import { describe, it, expect } from 'vitest';
import { uid } from '../src/lib/uid';

describe('uid', () => {
  it('returns a string', () => {
    expect(typeof uid()).toBe('string');
  });

  it('uses the provided prefix', () => {
    expect(uid('tmpl').startsWith('tmpl_')).toBe(true);
    expect(uid('node').startsWith('node_')).toBe(true);
  });

  it('defaults to "n" prefix', () => {
    expect(uid().startsWith('n_')).toBe(true);
  });

  it('generates unique IDs on consecutive calls', () => {
    const ids = new Set(Array.from({ length: 1000 }, () => uid()));
    expect(ids.size).toBe(1000);
  });

  it('is monotonically increasing (later IDs sort after earlier ones)', () => {
    const a = uid();
    const b = uid();
    // The numeric portion after the prefix should increase
    const numA = parseInt(a.split('_')[1], 36);
    const numB = parseInt(b.split('_')[1], 36);
    expect(numB).toBeGreaterThan(numA);
  });
});
