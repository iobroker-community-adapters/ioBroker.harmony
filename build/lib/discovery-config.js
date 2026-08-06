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
exports.buildDiscoveryPlan = buildDiscoveryPlan;
exports.broadcastForInterface = broadcastForInterface;
exports.broadcastFromCidr = broadcastFromCidr;
exports.isValidIPv4 = isValidIPv4;
exports.clampDiscoverInterval = clampDiscoverInterval;
const os = __importStar(require("node:os"));
const FALLBACK_BROADCAST = '255.255.255.255';
/**
 * Build a discovery plan from adapter config + local network state.
 *
 * Rules:
 * - If at least one valid manual hub IP is configured, the adapter contacts only
 *   those IPs directly (unicast). No broadcast — manual mode is explicit and skips
 *   network-wide scanning.
 * - Otherwise the adapter broadcasts. If a network interface is selected, the
 *   broadcast address is derived from that interface's CIDR. If no interface is
 *   selected, the global broadcast `255.255.255.255` is used.
 */
function buildDiscoveryPlan(config, interfaces = os.networkInterfaces()) {
    var _a;
    const manual = ((_a = config.devices) !== null && _a !== void 0 ? _a : [])
        .map(d => (typeof (d === null || d === void 0 ? void 0 : d.ip) === 'string' ? d.ip.trim() : ''))
        .filter(ip => ip.length > 0 && isValidIPv4(ip));
    let bindAddress = typeof config.networkInterface === 'string' &&
        config.networkInterface.length > 0 &&
        config.networkInterface !== '0.0.0.0'
        ? config.networkInterface
        : undefined;
    // Resolve the broadcast address for the selected interface. A null result means
    // the configured IP is not a current local interface (e.g. the host's DHCP lease
    // changed, or the config was copied from another machine). Binding the UDP socket
    // to a stale address would throw EADDRNOTAVAIL, so fall back to OS-pick instead of
    // pinning a dead address — for both unicast and broadcast mode.
    let interfaceBroadcast = null;
    if (bindAddress) {
        interfaceBroadcast = broadcastForInterface(bindAddress, interfaces);
        if (interfaceBroadcast === null) {
            bindAddress = undefined;
        }
    }
    if (manual.length > 0) {
        return { mode: 'unicast', bindAddress, targets: manual };
    }
    return { mode: 'broadcast', bindAddress, targets: [interfaceBroadcast !== null && interfaceBroadcast !== void 0 ? interfaceBroadcast : FALLBACK_BROADCAST] };
}
/**
 * Compute the IPv4 broadcast address for a given local interface IP, by looking
 * up the interface's CIDR in `os.networkInterfaces()`.
 *
 * Returns null if the IP is not a known local interface or the CIDR is missing.
 */
function broadcastForInterface(interfaceIp, interfaces = os.networkInterfaces()) {
    for (const ifaces of Object.values(interfaces)) {
        if (!ifaces) {
            continue;
        }
        for (const iface of ifaces) {
            if (iface.family === 'IPv4' && iface.address === interfaceIp && iface.cidr) {
                return broadcastFromCidr(iface.cidr);
            }
        }
    }
    return null;
}
/**
 * Derive the IPv4 broadcast address from a CIDR string like `192.168.1.5/24`.
 * Returns null on invalid input.
 */
function broadcastFromCidr(cidr) {
    const slash = cidr.indexOf('/');
    if (slash < 0) {
        return null;
    }
    const ip = cidr.slice(0, slash);
    const prefix = parseInt(cidr.slice(slash + 1), 10);
    if (!isValidIPv4(ip) || isNaN(prefix) || prefix < 0 || prefix > 32) {
        return null;
    }
    const parts = ip.split('.').map(Number);
    const ipInt = ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
    const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
    const broadcastInt = (ipInt | (~mask >>> 0)) >>> 0;
    return [
        (broadcastInt >>> 24) & 0xff,
        (broadcastInt >>> 16) & 0xff,
        (broadcastInt >>> 8) & 0xff,
        broadcastInt & 0xff,
    ].join('.');
}
function isValidIPv4(ip) {
    if (typeof ip !== 'string') {
        return false;
    }
    const parts = ip.split('.');
    if (parts.length !== 4) {
        return false;
    }
    for (const part of parts) {
        if (!/^\d+$/.test(part)) {
            return false;
        }
        const n = parseInt(part, 10);
        if (n < 0 || n > 255) {
            return false;
        }
    }
    return true;
}
function clampDiscoverInterval(raw, defaultMs = 2000, minMs = 500) {
    const n = typeof raw === 'number' ? raw : parseInt(String(raw !== null && raw !== void 0 ? raw : ''), 10);
    if (isNaN(n) || n < minMs) {
        return Math.max(defaultMs, minMs);
    }
    return n;
}
//# sourceMappingURL=discovery-config.js.map