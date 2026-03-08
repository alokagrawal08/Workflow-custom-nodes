import { STORAGE_KEYS } from './constants.js';

/**
 * Persistence layer backed by localStorage.
 *
 * ── Template storage format ──
 * Key: "wf_templates"
 * Value (JSON):
 * {
 *   [templateId: string]: {
 *     id:         string,               // unique template identifier
 *     nodeType:   string,               // "process" | "decision" | "io" | "transform" | "custom"
 *     label:      string,               // human-readable name
 *     properties: Array<{               // configurable key-value pairs
 *       key:      string,
 *       value:    string,
 *       type:     "string" | "number" | "boolean" | "select",
 *       options?: string                // comma-separated values (for type "select")
 *     }>,
 *     version:    number,               // incremented on every update
 *     createdAt:  string,               // ISO 8601
 *     updatedAt:  string,               // ISO 8601
 *     readonly:   boolean               // if true, instances are non-editable
 *   }
 * }
 *
 * ── Graph state storage format ──
 * Key: "wf_graph_state"
 * Value (JSON):
 * {
 *   nodes: ReactFlowNode[],            // { id, type, position, data: { config } }
 *   edges: ReactFlowEdge[]             // { id, source, target, animated, style }
 * }
 */

export const Storage = {
  // ─── Templates ───────────────────────────────
  getTemplates() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.TEMPLATES)) || {};
    } catch {
      return {};
    }
  },

  saveTemplates(templates) {
    localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(templates));
  },

  // ─── Graph state ─────────────────────────────
  getGraphState() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.GRAPH_STATE));
    } catch {
      return null;
    }
  },

  saveGraphState(nodes, edges) {
    localStorage.setItem(
      STORAGE_KEYS.GRAPH_STATE,
      JSON.stringify({ nodes, edges }),
    );
  },
};
