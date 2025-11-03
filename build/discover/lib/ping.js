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
const os = __importStar(require("node:os"));
class PingOptions {
}
exports.PingOptions = PingOptions;
function generateBroadcastIp(logger) {
    if (!/^win/i.test(process.platform)) {
        logger('We are running non windows so just broadcast');
        return ['255.255.255.255'];
    }
    logger('We are running on windows so we try to find the local ip address to fix a windows broadcast protocol bug');
    const ifaces = os.networkInterfaces();
    const possibleIps = [];
    Object.keys(ifaces).forEach(ifname => {
        ifaces[ifname].forEach(iface => {
            // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
            if ('IPv4' !== iface.family || iface.internal !== false) {
                return;
            }
            possibleIps.push(iface.address);
        });
    });
    return possibleIps
        .filter(ip => ip.indexOf('192.') === 0)
        .map(ip => {
        const nums = ip.split('.');
        nums[3] = '255';
        logger(`Fallback to local ip address -> ${nums.join('.')}`);
        return nums.join('.');
    });
}
class Ping {
    constructor(portToAnnounce, options) {
        // try to find an ip address that is in a local (home) network
        options || (options = {});
        this.logger = options.logger || (() => { });
        options.address || (options.address = generateBroadcastIp(this.logger));
        if (typeof options.address === 'string') {
            options.address = [options.address];
        }
        // merge default with user options
        // default address is 255.255.255.255 from generateBroadcastIp()
        this.options = {
            ...{
                port: 5224,
                interval: 2000,
            },
            ...options,
        };
        this.logger(`Ping(${portToAnnounce}, ${JSON.stringify(this.options)})`);
        this.portToAnnounce = portToAnnounce;
        // init the welcome messages
        this.message = `_logitech-reverse-bonjour._tcp.local.\n${portToAnnounce}`;
        this.messageBuffer = Buffer.from(this.message);
    }
    /**
     * emit a broadcast into the network.
     */
    emit() {
        this.logger('emit()');
        // emit to all the addresses
        this.options.address.forEach(address => this.socket.send(this.messageBuffer, 0, this.message.length, this.options.port, address, err => {
            if (err) {
                this.logger(`error emitting ping. stopping now :( (${err})`);
                this.stop();
            }
        }));
    }
    /**
     * Start an interval emitting broadcasts into the network.
     */
    start() {
        this.logger('start()');
        if (this.socket) {
            this.logger('Ping is already running, call stop() first');
            return;
        }
        // setup socket to broadcast messages from the incoming ping
        // unref so that the app can close
        this.socket = dgram.createSocket('udp4');
        this.socket.bind(this.portToAnnounce, () => {
            // this.options.port,  -> forget this bind no need to care from which port the data was send??
            this.socket.setBroadcast(true);
        });
        this.socket.unref();
        // start the interval, do not unref to keep Node.js running
        this.intervalToken = setInterval(() => this.emit(), this.options.interval);
    }
    /**
     * Stop broadcasting into the network.
     */
    stop() {
        this.logger('stop()');
        if (this.intervalToken === undefined) {
            this.logger('ping has already been stopped, call start() first');
            return;
        }
        // stop the message emit
        clearInterval(this.intervalToken);
        this.intervalToken = undefined;
        // close the socket
        this.socket.close();
        this.socket = undefined;
    }
    /**
     * Return an indicator it this ping is currently running.
     */
    isRunning() {
        this.logger('isRunning()');
        return this.intervalToken !== undefined;
    }
}
exports.Ping = Ping;
//# sourceMappingURL=ping.js.map