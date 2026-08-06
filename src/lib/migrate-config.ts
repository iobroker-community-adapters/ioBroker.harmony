import * as os from 'node:os';

// No .js extension: the unit tests load this file through ts-node/register, which resolves
// it as CommonJS and cannot map a .js specifier onto the sibling .ts file.
import { interfaceForBroadcast, isValidIPv4 } from './discovery-config';

/** The value the removed `subnet` setting had on a default installation. */
const LEGACY_DEFAULT = '255.255.255.255';

/** The parts of the adapter's `native` config the migration looks at. */
export interface MigratableConfig {
    /**
     * Removed setting. Held a comma-separated list of discovery ping targets — either
     * directed broadcast addresses or hub IPs, the field never distinguished the two.
     */
    subnet?: unknown;
    networkInterface?: string;
    devices?: { ip: string; name?: string }[];
}

export interface MigrationResult {
    /** True when the config has to be written back — also when nothing was carried over, because the `subnet` key itself still has to go. */
    changed: boolean;
    /** The old value as it was found, for the log line. */
    legacyValue: string;
    networkInterface: string;
    devices: { ip: string; name?: string }[];
    /** One human-readable line per handled `subnet` entry, for the adapter log. */
    notes: string[];
}

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
export function migrateLegacyConfig(
    config: MigratableConfig,
    interfaces: NodeJS.Dict<os.NetworkInterfaceInfo[]> = os.networkInterfaces(),
): MigrationResult {
    const devices = (config.devices ?? []).map(device => ({ ...device }));
    let networkInterface = typeof config.networkInterface === 'string' ? config.networkInterface : '';
    const notes: string[] = [];

    // Absent on a fresh install and on an instance that has already been migrated.
    if (config.subnet === undefined || config.subnet === null) {
        return { changed: false, legacyValue: '', networkInterface, devices, notes };
    }

    // The setting only ever held a string. Anything else carries nothing over, but the key
    // still has to be removed, so the migration counts as changed either way.
    const legacyValue = typeof config.subnet === 'string' ? config.subnet : '';

    const entries = legacyValue
        .split(',')
        .map(entry => entry.trim())
        .filter(entry => entry.length > 0);

    for (const entry of entries) {
        if (entry === LEGACY_DEFAULT) {
            continue;
        }

        if (!isValidIPv4(entry)) {
            notes.push(`"${entry}" is not an IPv4 address and was dropped`);
            continue;
        }

        const iface = interfaceForBroadcast(entry, interfaces);
        if (iface) {
            if (networkInterface) {
                notes.push(`"${entry}" was dropped, network interface ${networkInterface} is already selected`);
            } else {
                networkInterface = iface;
                notes.push(`"${entry}" is the broadcast address of local interface ${iface} — selected that interface`);
            }
            continue;
        }

        if (devices.some(device => typeof device?.ip === 'string' && device.ip.trim() === entry)) {
            notes.push(`"${entry}" is already listed as a manual hub IP`);
            continue;
        }

        devices.push({ ip: entry });
        notes.push(`"${entry}" was carried over into the manual hub list`);
    }

    return { changed: true, legacyValue, networkInterface, devices, notes };
}
