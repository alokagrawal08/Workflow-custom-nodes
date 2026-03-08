import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Storage } from '../src/lib/storage';
import { STORAGE_KEYS } from '../src/lib/constants';

/**
 * We mock localStorage for isolated, deterministic tests.
 */
const mockStorage = {};

beforeEach(() => {
  Object.keys(mockStorage).forEach((k) => delete mockStorage[k]);

  vi.stubGlobal('localStorage', {
    getItem: vi.fn((key) => mockStorage[key] ?? null),
    setItem: vi.fn((key, val) => {
      mockStorage[key] = val;
    }),
    removeItem: vi.fn((key) => {
      delete mockStorage[key];
    }),
  });
});

describe('Storage – templates', () => {
  it('returns an empty object when nothing is stored', () => {
    expect(Storage.getTemplates()).toEqual({});
  });

  it('returns an empty object when stored value is invalid JSON', () => {
    mockStorage[STORAGE_KEYS.TEMPLATES] = '{bad json';
    expect(Storage.getTemplates()).toEqual({});
  });

  it('round-trips template data', () => {
    const templates = {
      tmpl_1: {
        id: 'tmpl_1',
        nodeType: 'process',
        label: 'Test',
        properties: [{ key: 'a', value: '1', type: 'string' }],
        version: 1,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
        readonly: false,
      },
    };

    Storage.saveTemplates(templates);
    expect(Storage.getTemplates()).toEqual(templates);
  });

  it('overwrites previous templates on save', () => {
    Storage.saveTemplates({ a: { id: 'a', nodeType: 'process' } });
    Storage.saveTemplates({ b: { id: 'b', nodeType: 'io' } });

    const result = Storage.getTemplates();
    expect(result).not.toHaveProperty('a');
    expect(result).toHaveProperty('b');
  });
});

describe('Storage – graph state', () => {
  it('returns null when nothing is stored', () => {
    expect(Storage.getGraphState()).toBeNull();
  });

  it('returns null for invalid JSON', () => {
    mockStorage[STORAGE_KEYS.GRAPH_STATE] = 'not json';
    expect(Storage.getGraphState()).toBeNull();
  });

  it('round-trips graph state', () => {
    const nodes = [
      { id: 'n_1', type: 'configNode', position: { x: 0, y: 0 }, data: {} },
    ];
    const edges = [
      { id: 'e_1', source: 'n_1', target: 'n_2' },
    ];

    Storage.saveGraphState(nodes, edges);
    const state = Storage.getGraphState();

    expect(state.nodes).toEqual(nodes);
    expect(state.edges).toEqual(edges);
  });
});
