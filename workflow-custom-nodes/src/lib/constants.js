/**
 * Application-wide constants.
 * Centralised here so nothing is scattered across components.
 */

/** localStorage keys used for persistence. */
export const STORAGE_KEYS = {
  TEMPLATES: 'wf_templates',
  GRAPH_STATE: 'wf_graph_state',
};

/**
 * Well-known colour palette for common node types.
 * Any type not in this map gets a deterministic colour
 * generated from its name via `getNodeColor()`.
 */
const KNOWN_COLORS = {
  process:   { bg: '#6366f1', light: '#eef2ff' },
  decision:  { bg: '#f59e0b', light: '#fffbeb' },
  io:        { bg: '#10b981', light: '#ecfdf5' },
  transform: { bg: '#ec4899', light: '#fdf2f8' },
  api:       { bg: '#8b5cf6', light: '#f5f3ff' },
  database:  { bg: '#0ea5e9', light: '#f0f9ff' },
  trigger:   { bg: '#f97316', light: '#fff7ed' },
  output:    { bg: '#14b8a6', light: '#f0fdfa' },
};

const FALLBACK_COLOR = { bg: '#64748b', light: '#f8fafc' };

/**
 * Generate a deterministic HSL colour from an arbitrary string.
 * This ensures custom node types always get the same colour
 * without requiring a predefined palette entry.
 */
function hashColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return {
    bg: `hsl(${hue}, 55%, 50%)`,
    light: `hsl(${hue}, 60%, 96%)`,
  };
}

/**
 * Get the colour pair for any node type — known or custom.
 *
 * @param {string} [nodeType] – the type string from node config
 * @returns {{ bg: string, light: string }}
 */
export function getNodeColor(nodeType) {
  if (!nodeType) return FALLBACK_COLOR;
  const lower = nodeType.toLowerCase().trim();
  return KNOWN_COLORS[lower] || hashColor(lower);
}

/** Re-export the known map for places that still need it (e.g. CSS classes). */
export const NODE_COLORS = KNOWN_COLORS;

/** Supported property value types. */
export const PROP_TYPES = ['string', 'number', 'boolean', 'select'];
