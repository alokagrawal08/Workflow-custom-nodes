import { describe, it, expect } from 'vitest';
import { getNodeColor, PROP_TYPES } from '../src/lib/constants';

describe('getNodeColor', () => {
  it('returns known colours for well-known types', () => {
    const result = getNodeColor('process');
    expect(result.bg).toBe('#6366f1');
    expect(result.light).toBe('#eef2ff');
  });

  it('is case-insensitive for known types', () => {
    expect(getNodeColor('Process').bg).toBe('#6366f1');
    expect(getNodeColor('DECISION').bg).toBe('#f59e0b');
  });

  it('generates a deterministic colour for unknown types', () => {
    const a = getNodeColor('my-custom-type');
    const b = getNodeColor('my-custom-type');
    expect(a).toEqual(b);
  });

  it('generates different colours for different custom types', () => {
    const a = getNodeColor('webhook');
    const b = getNodeColor('scheduler');
    expect(a.bg).not.toBe(b.bg);
  });

  it('returns fallback colour for empty/null/undefined', () => {
    const fallback = { bg: '#64748b', light: '#f8fafc' };
    expect(getNodeColor(null)).toEqual(fallback);
    expect(getNodeColor(undefined)).toEqual(fallback);
    expect(getNodeColor('')).toEqual(fallback);
  });

  it('generated colours are valid HSL strings', () => {
    const result = getNodeColor('some-random-type');
    expect(result.bg).toMatch(/^hsl\(\d+, \d+%, \d+%\)$/);
    expect(result.light).toMatch(/^hsl\(\d+, \d+%, \d+%\)$/);
  });
});

describe('PROP_TYPES', () => {
  it('contains the four expected types', () => {
    expect(PROP_TYPES).toEqual(['string', 'number', 'boolean', 'select']);
  });
});
