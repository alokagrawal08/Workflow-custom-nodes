/**
 * Monotonic unique-ID generator.
 *
 * IDs are prefixed for readability (e.g. "n_lx3f7k", "tmpl_lx3f7m")
 * and guaranteed to be unique within a single browser session because the
 * counter starts at Date.now() and only ever increments.
 *
 * No global mutable state is exposed — the counter is module-scoped and
 * only accessible through the `uid()` function.
 */
let counter = Date.now();

export function uid(prefix = 'n') {
  return `${prefix}_${(++counter).toString(36)}`;
}
