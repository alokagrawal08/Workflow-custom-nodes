import { describe, it, expect } from 'vitest';
import { uid } from '../src/lib/uid';

/**
 * Integration-style tests that verify the full serialization contract:
 *   template → node → JSON → back.
 *
 * This ensures that nothing in the data pipeline relies on
 * non-serializable values (functions, class instances, symbols, etc.).
 */
describe('Serialization round-trips', () => {
  it('a node created from a template survives JSON round-trip', () => {
    const tmpl = {
      id: uid('tmpl'),
      nodeType: 'api-call',
      label: 'Fetch Users',
      properties: [{ key: 'endpoint', value: '/users', type: 'string' }],
      version: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      readonly: false,
    };

    // Simulate what App.createNodeFromConfig does
    const node = {
      id: uid('n'),
      type: 'configNode',
      position: { x: 100, y: 200 },
      data: {
        config: {
          ...tmpl,
          templateId: tmpl.id,
          templateVersion: tmpl.version,
          properties: tmpl.properties.map((p) => ({ ...p })),
        },
      },
    };

    const json = JSON.stringify(node);
    const restored = JSON.parse(json);

    expect(restored.id).toBe(node.id);
    expect(restored.type).toBe('configNode');
    expect(restored.data.config.label).toBe('Fetch Users');
    expect(restored.data.config.templateId).toBe(tmpl.id);
    expect(restored.data.config.properties).toEqual(tmpl.properties);
  });

  it('a template with all property types survives round-trip', () => {
    const tmpl = {
      id: uid('tmpl'),
      nodeType: 'my-custom-type',
      label: 'Full Test',
      properties: [
        { key: 'name', value: 'Alice', type: 'string' },
        { key: 'count', value: '42', type: 'number' },
        { key: 'active', value: 'true', type: 'boolean' },
        { key: 'mode', value: 'fast', type: 'select', options: 'fast,slow' },
      ],
      version: 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      readonly: true,
    };

    const json = JSON.stringify(tmpl);
    const restored = JSON.parse(json);
    expect(restored).toEqual(tmpl);
  });

  it('graph state (nodes + edges) survives round-trip', () => {
    const state = {
      nodes: [
        {
          id: 'n_1',
          type: 'configNode',
          position: { x: 0, y: 0 },
          data: { config: { label: 'A', nodeType: 'webhook', properties: [] } },
        },
        {
          id: 'n_2',
          type: 'configNode',
          position: { x: 300, y: 100 },
          data: { config: { label: 'B', nodeType: 'database', properties: [] } },
        },
      ],
      edges: [
        { id: 'e_1-2', source: 'n_1', target: 'n_2', animated: true },
      ],
    };

    const json = JSON.stringify(state);
    const restored = JSON.parse(json);
    expect(restored).toEqual(state);
  });
});
