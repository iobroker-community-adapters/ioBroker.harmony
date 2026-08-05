/**
 * Replace every character that ioBroker rejects in a state ID. Covers the
 * historic blocklist (`[]*,;'"\`<>\?`), all whitespace (incl. tab/newline —
 * the trailing-tab in hub-supplied device names is the original report in
 * iobroker-community-adapters/ioBroker.harmony#98) and dots, so a hub-supplied
 * label cannot accidentally split the ID into path segments.
 *
 * If the input is empty, not a string, or made up entirely of forbidden
 * characters, returns `'unnamed'` so the caller still gets a valid ID segment.
 */
export const FORBIDDEN_CHARS = /[\][*,;'"`<>\\?\s.]/g;

export function fixId(id: unknown): string {
    const source = typeof id === 'string' ? id : '';
    // Decide the fallback from the source, not the replaced string: an input made
    // up entirely of forbidden characters (e.g. '...') must become 'unnamed', not
    // '___', while a legitimately allowed '_' is kept.
    const hasAllowed = source.replace(FORBIDDEN_CHARS, '').length > 0;
    return hasAllowed ? source.replace(FORBIDDEN_CHARS, '_') : 'unnamed';
}
