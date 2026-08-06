"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateLegacyConfig = migrateLegacyConfig;
const os = __importStar(require("node:os"));
// No .js extension: the unit tests load this file through ts-node/register, which resolves
// it as CommonJS and cannot map a .js specifier onto the sibling .ts file.
const discovery_config_1 = require("./discovery-config");
/** The value the removed `subnet` setting had on a default installation. */
const LEGACY_DEFAULT = '255.255.255.255';
/**
 * Convert the removed `subnet` setting into the current discovery config.
 *
 * The old field was a plain list of addresses the discovery ping was sent to, which is
 * why it accepted both meanings. Each entry is mapped to whichever new setting keeps the
 * previous behaviour:
 *
 * - `255.255.255.255` — the old default. The new default (no interface selected)
 *   broadcasts there too, so nothing is carried over.
 * - the broadcast address of a local interface, e.g. `192.168.1.255` — selects that
 *   interface, so the adapter keeps broadcasting into the same network and additionally
 *   binds the socket to it.
 * - anything else that is a valid IPv4 address — carried over into the manual hub list,
 *   which contacts exactly that address and nothing else, as `subnet` did.
 *
 * Pure function: pass `interfaces` in tests, otherwise the live interface list is used.
 */
function migrateLegacyConfig(config, interfaces = os.networkInterfaces()) {
    var _a;
    const devices = ((_a = config.devices) !== null && _a !== void 0 ? _a : []).map(device => ({ ...device }));
    let networkInterface = typeof config.networkInterface === 'string' ? config.networkInterface : '';
    const notes = [];
    // Absent on a fresh install and on an instance that has already been migrated.
    if (config.subnet === undefined || config.subnet === null) {
        return { changed: false, networkInterface, devices, notes };
    }
    const entries = String(config.subnet)
        .split(',')
        .map(entry => entry.trim())
        .filter(entry => entry.length > 0);
    for (const entry of entries) {
        if (entry === LEGACY_DEFAULT) {
            continue;
        }
        if (!(0, discovery_config_1.isValidIPv4)(entry)) {
            notes.push(`"${entry}" is not an IPv4 address and was dropped`);
            continue;
        }
        const iface = (0, discovery_config_1.interfaceForBroadcast)(entry, interfaces);
        if (iface) {
            if (networkInterface) {
                notes.push(`"${entry}" was dropped, network interface ${networkInterface} is already selected`);
            }
            else {
                networkInterface = iface;
                notes.push(`"${entry}" is the broadcast address of local interface ${iface} — selected that interface`);
            }
            continue;
        }
        if (devices.some(device => typeof (device === null || device === void 0 ? void 0 : device.ip) === 'string' && device.ip.trim() === entry)) {
            notes.push(`"${entry}" is already listed as a manual hub IP`);
            continue;
        }
        devices.push({ ip: entry });
        notes.push(`"${entry}" was carried over into the manual hub list`);
    }
    return { changed: true, networkInterface, devices, notes };
}
//# sourceMappingURL=migrate-config.js.map