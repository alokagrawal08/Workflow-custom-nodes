/**
 * Validates a node configuration object.
 *
 * Returns an array of human-readable error strings.
 * An empty array means the configuration is valid.
 *
 * Rules:
 *  - `label` must be a non-empty string.
 *  - `nodeType` must be present.
 *  - Every property must have a non-empty `key`.
 *  - Property keys must be unique.
 *  - Properties with type "number" must have a numeric value (or empty).
 *  - Properties with type "select" must define comma-separated options.
 *
 * @param {object} config – node configuration to validate
 * @returns {string[]} – list of validation error messages
 */
export function validateNodeConfig(config) {
  const errors = [];

  if (!config.label?.trim()) {
    errors.push('Label is required.');
  }

  if (!config.nodeType) {
    errors.push('Node type is required.');
  }

  if (Array.isArray(config.properties)) {
    const keys = config.properties.map((p) => p.key);
    const seen = new Set();
    const dupes = new Set();

    for (const k of keys) {
      if (k && seen.has(k)) dupes.add(k);
      seen.add(k);
    }

    if (dupes.size) {
      errors.push(`Duplicate property keys: ${[...dupes].join(', ')}`);
    }

    config.properties.forEach((p, i) => {
      if (!p.key?.trim()) {
        errors.push(`Property ${i + 1}: key is required.`);
      }

      if (p.type === 'number' && p.value !== '' && p.value != null && isNaN(Number(p.value))) {
        errors.push(`Property "${p.key}": value must be a number.`);
      }

      if (p.type === 'select' && !p.options?.trim()) {
        errors.push(`Property "${p.key}": options are required for select type.`);
      }
    });
  }

  return errors;
}
