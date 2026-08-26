/**
 * Whether a route renders without an institute having been selected.
 *
 * The institute management pages do, and must: a super admin on a fresh system -- or on one where
 * every institute has been deactivated -- has nothing to select, and needs to reach
 * "Institutes" -> "Register" to create the institute that would give them something (issue #14).
 * Guarding those pages on a selected institute is a deadlock: no institute, no page; no page, no
 * way to make one.
 *
 * Kept here rather than inline in `_app.tsx` so the rule has a name and a test, and free of React
 * imports so testing it costs nothing.
 */
export function bypassesInstituteSelection(pathname: string): boolean {
  return pathname.startsWith("/institutes");
}
