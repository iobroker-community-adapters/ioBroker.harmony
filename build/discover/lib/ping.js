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
exports.Ping = exports.PingOptions = void 0;
const dgram = __importStar(require("node:dgram"));
class PingOptions {
}
exports.PingOptions = PingOptions;
class Ping {
    constructor(portToAnnounce, options) {
        options || (options = {});
        this.logger = options.logger || (() => { });
        options.address || (options.address = ['255.255.255.255']);
        if (typeof options.address === 'string') {
            options.address = [options.address];
        }
        this.options = {
            port: 5224,
            interval: 2000,
            ...options,
        };
        this.logger(`Ping(${portToAnnounce}, ${JSON.stringify(this.options)})`);
        this.portToAnnounce = portToAnnounce;
        this.message = `_logitech-reverse-bonjour._tcp.local.\n${portToAnnounce}`;
        this.messageBuffer = Buffer.from(this.message);
    }
    /**
     * Emit a discovery ping to every configured address.
     */
    emit() {
        this.logger('emit()');
        // Held in a local: inside the callback the compiler cannot know that this.socket is
        // still the same one, and stop() may well have cleared it by then.
        const socket = this.socket;
        if (!socket) {
            return;
        }
        this.options.address.forEach(address => socket.send(this.messageBuffer, 0, this.message.length, this.options.port, address, err => {
            // Per-address failure only: one unreachable target (a hub that is switched
            // off, a route that is down) must not stop the pings for every other one.
            if (err) {
                this.logger(`error emitting ping to ${address}: ${err.message}`);
            }
        }));
    }
    /**
     * Start emitting discovery pings on an interval.
     */
    start() {
        this.logger('start()');
        if (this.socket) {
            this.logger('Ping is already running, call stop() first');
            return;
        }
        this.socket = dgram.createSocket('udp4');
        // Without this listener a bind failure (e.g. a stale bindAddress that is no longer a
        // local interface) would surface as an uncaught 'error' event and crash the adapter.
        this.socket.on('error', (err) => {
            var _a, _b;
            this.logger(`socket error: ${err.message}`);
            (_b = (_a = this.options).onError) === null || _b === void 0 ? void 0 : _b.call(_a, err);
            this.stop();
        });
        this.socket.bind(this.portToAnnounce, this.options.bindAddress, () => {
            var _a;
            // Always allow broadcast destinations. The option only *permits* sending to a
            // broadcast address and changes nothing for unicast, so leaving it off would
            // only turn a manually configured broadcast address into an EACCES per ping.
            (_a = this.socket) === null || _a === void 0 ? void 0 : _a.setBroadcast(true);
        });
        this.socket.unref();
        this.intervalToken = setInterval(() => this.emit(), this.options.interval);
    }
    /**
     * Stop the ping interval and close the socket.
     */
    stop() {
        var _a, _b;
        this.logger('stop()');
        if (this.intervalToken === undefined && !this.socket) {
            this.logger('ping has already been stopped, call start() first');
            return;
        }
        if (this.intervalToken !== undefined) {
            clearInterval(this.intervalToken);
            this.intervalToken = undefined;
        }
        // close() throws when the socket never made it past a failed bind, which is exactly
        // the situation the error handler calls stop() in.
        try {
            (_a = this.socket) === null || _a === void 0 ? void 0 : _a.close();
        }
        catch (err) {
            this.logger(`socket close failed: ${(_b = err === null || err === void 0 ? void 0 : err.message) !== null && _b !== void 0 ? _b : err}`);
        }
        this.socket = undefined;
    }
    isRunning() {
        return this.intervalToken !== undefined;
    }
}
exports.Ping = Ping;
//# sourceMappingURL=ping.js.map