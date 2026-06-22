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
        this.broadcast = options.broadcast !== false;
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
        this.options.address.forEach(address => this.socket.send(this.messageBuffer, 0, this.message.length, this.options.port, address, err => {
            if (err) {
                this.logger(`error emitting ping. stopping now :( (${err})`);
                this.stop();
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
            if (this.broadcast) {
                this.socket.setBroadcast(true);
            }
        });
        this.socket.unref();
        this.intervalToken = setInterval(() => this.emit(), this.options.interval);
    }
    /**
     * Stop the ping interval and close the socket.
     */
    stop() {
        this.logger('stop()');
        if (this.intervalToken === undefined) {
            this.logger('ping has already been stopped, call start() first');
            return;
        }
        clearInterval(this.intervalToken);
        this.intervalToken = undefined;
        this.socket.close();
        this.socket = undefined;
    }
    isRunning() {
        return this.intervalToken !== undefined;
    }
}
exports.Ping = Ping;
//# sourceMappingURL=ping.js.map