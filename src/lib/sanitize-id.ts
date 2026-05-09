/**
 * Replace every character that ioBroker rejects in a state ID. Covers the
 * historic blocklist (`[]*,;'"\`<>\?`), all whitespace (incl. tab/newline —
 * the trailing-tab in hub-supplied device names is the original report in
 * iobroker-community-adapters/ioBroker.harmony#98) and dots, so a hub-supplied
 * label cannot accidentally split the ID into path segments.
 *
 * If the input is not a string or every character is forbidden, returns
 * `'unnamed'` so the caller still gets a valid ID segment.
 */
export const FORBIDDEN_CHARS = /[\][*,;'"`<>\\?\s.]/g;

export function fixId(id: string): string {
    const cleaned = (typeof id === 'string' ? id : '').replace(FORBIDDEN_CHARS, '_');
    return cleaned.length > 0 ? cleaned : 'unnamed';
}
