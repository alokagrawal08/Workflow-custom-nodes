import { describe, it, expect } from 'vitest';
import { validateNodeConfig } from '../src/lib/validation';

describe('validateNodeConfig', () => {
  it('returns no errors for a valid config', () => {
    const config = {
      label: 'Process',
      nodeType: 'process',
      properties: [
        { key: 'action', value: 'run', type: 'string' },
        { key: 'timeout', value: '30', type: 'number' },
      ],
    };
    expect(validateNodeConfig(config)).toEqual([]);
  });

  it('requires a label', () => {
    const config = { label: '', nodeType: 'process', properties: [] };
    const errors = validateNodeConfig(config);
    expect(errors).toContain('Label is required.');
  });

  it('requires a non-whitespace label', () => {
    const config = { label: '   ', nodeType: 'process', properties: [] };
    const errors = validateNodeConfig(config);
    expect(errors).toContain('Label is required.');
  });

  it('requires a nodeType', () => {
    const config = { label: 'Test', nodeType: '', properties: [] };
    const errors = validateNodeConfig(config);
    expect(errors).toContain('Node type is required.');
  });

  it('detects duplicate property keys', () => {
    const config = {
      label: 'Test',
      nodeType: 'process',
      properties: [
        { key: 'name', value: 'a', type: 'string' },
        { key: 'name', value: 'b', type: 'string' },
      ],
    };
    const errors = validateNodeConfig(config);
    expect(errors.some((e) => e.includes('Duplicate property keys'))).toBe(true);
  });

  it('requires non-empty property keys', () => {
    const config = {
      label: 'Test',
      nodeType: 'process',
      properties: [{ key: '', value: 'val', type: 'string' }],
    };
    const errors = validateNodeConfig(config);
    expect(errors.some((e) => e.includes('key is required'))).toBe(true);
  });

  it('validates number type properties', () => {
    const config = {
      label: 'Test',
      nodeType: 'process',
      properties: [{ key: 'count', value: 'abc', type: 'number' }],
    };
    const errors = validateNodeConfig(config);
    expect(errors.some((e) => e.includes('must be a number'))).toBe(true);
  });

  it('allows empty value for number type', () => {
    const config = {
      label: 'Test',
      nodeType: 'process',
      properties: [{ key: 'count', value: '', type: 'number' }],
    };
    expect(validateNodeConfig(config)).toEqual([]);
  });

  it('requires options for select type', () => {
    const config = {
      label: 'Test',
      nodeType: 'process',
      properties: [{ key: 'mode', value: '', type: 'select', options: '' }],
    };
    const errors = validateNodeConfig(config);
    expect(errors.some((e) => e.includes('options are required'))).toBe(true);
  });

  it('passes when select has valid options', () => {
    const config = {
      label: 'Test',
      nodeType: 'process',
      properties: [{ key: 'mode', value: 'a', type: 'select', options: 'a,b,c' }],
    };
    expect(validateNodeConfig(config)).toEqual([]);
  });

  it('handles missing properties array gracefully', () => {
    const config = { label: 'Test', nodeType: 'process' };
    expect(validateNodeConfig(config)).toEqual([]);
  });

  it('collects multiple errors at once', () => {
    const config = {
      label: '',
      nodeType: '',
      properties: [
        { key: '', value: 'abc', type: 'number' },
      ],
    };
    const errors = validateNodeConfig(config);
    expect(errors.length).toBeGreaterThanOrEqual(3);
  });
});
