"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FORBIDDEN_CHARS = void 0;
exports.fixId = fixId;
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
exports.FORBIDDEN_CHARS = /[\][*,;'"`<>\\?\s.]/g;
function fixId(id) {
    const source = typeof id === 'string' ? id : '';
    // Decide the fallback from the source, not the replaced string: an input made
    // up entirely of forbidden characters (e.g. '...') must become 'unnamed', not
    // '___', while a legitimately allowed '_' is kept.
    const hasAllowed = source.replace(exports.FORBIDDEN_CHARS, '').length > 0;
    return hasAllowed ? source.replace(exports.FORBIDDEN_CHARS, '_') : 'unnamed';
}
//# sourceMappingURL=sanitize-id.js.map