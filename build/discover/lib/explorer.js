"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Explorer = exports.ExplorerEvents = void 0;
const node_events_1 = require("node:events");
const ping_js_1 = require("./ping.js");
const responseCollector_js_1 = require("./responseCollector.js");
function deserializeResponse(response) {
    const pairs = {};
    response.split(';').forEach(rawPair => {
        const split = rawPair.split(':');
        pairs[split[0]] = split[1];
    });
    return {
        uuid: pairs.uuid,
        ip: pairs.ip,
        friendlyName: pairs.friendlyName,
        fullHubInfo: pairs,
        lastSeen: Date.now(),
    };
}
function arrayOfKnownHubs(knownHubs) {
    return Array.from(knownHubs.values());
}
var ExplorerEvents;
(function (ExplorerEvents) {
    ExplorerEvents["ONLINE"] = "online";
    ExplorerEvents["OFFLINE"] = "offline";
    ExplorerEvents["UPDATE"] = "update";
})(ExplorerEvents || (exports.ExplorerEvents = ExplorerEvents = {}));
class Explorer extends node_events_1.EventEmitter {
    /**
     * @param incomingPort The port on the current client to use when pinging.
     * If unspecified using any port available.
     * @param pingOptions Defines the broadcasting details for this explorer.
     * @param cleanUpTimeout The interval that the hub does not respond to be
     * considered offline, but minimal 2 * ping interval + 2500 ms, default 5000 ms
     */
    constructor(incomingPort = 5222, pingOptions, cleanUpTimeout = 5000) {
        super();
        this.knownHubs = new Map();
        this.port = incomingPort;
        if (pingOptions === null || pingOptions === void 0 ? void 0 : pingOptions.interval) {
            this.cleanUpTimeout = Math.max(cleanUpTimeout, pingOptions.interval * 2 + 2500);
        }
        else {
            this.cleanUpTimeout = cleanUpTimeout;
        }
        this.logger = (pingOptions === null || pingOptions === void 0 ? void 0 : pingOptions.logger) || (() => { });
        this.logger(`Explorer(${this.port})`);
        this.ping = new ping_js_1.Ping(this.port, pingOptions);
    }
    /**
     * Inits the listening for hub replies, and starts broadcasting.
     */
    start() {
        this.logger('start()');
        this.responseCollector = new responseCollector_js_1.ResponseCollector(this.port, this.logger);
        this.responseCollector.on(responseCollector_js_1.ResponseCollectorEvents.RESPONSE, (data) => this.handleResponse(data));
        this.cleanUpIntervalToken = setInterval(() => this.executeCleanUp(), 2000);
        this.responseCollector.start();
        this.ping.start();
    }
    /**
     * Stop the emitting of broadcasts and disassamble all listeners.
     */
    stop() {
        this.logger('stop()');
        this.ping.stop();
        this.responseCollector.stop();
        clearInterval(this.cleanUpIntervalToken);
    }
    /**
     * Handles the response from a hub by deserializing the response
     * and storing the information. Also emits the online and update events.
     *
     * @param data response data from the hub
     */
    handleResponse(data) {
        const hub = deserializeResponse(data);
        if (this.knownHubs.get(hub.uuid) === undefined) {
            this.logger(`discovered new hub ${hub.friendlyName}`);
            this.knownHubs.set(hub.uuid, hub);
            this.emit(ExplorerEvents.ONLINE, hub);
            this.emit(ExplorerEvents.UPDATE, arrayOfKnownHubs(this.knownHubs));
        }
        else {
            this.knownHubs.get(hub.uuid).lastSeen = Date.now();
        }
    }
    /**
     * Run a cleanup event all 5 seconds to  make sure unavailable hubs
     * are no longer tracked and discharged. Also emits the offline and update events.
     */
    executeCleanUp() {
        this.logger('executeCleanUp()');
        const now = Date.now();
        Array.from(this.knownHubs.values()).forEach((hub) => {
            const diff = now - hub.lastSeen;
            if (diff > this.cleanUpTimeout) {
                this.logger(`hub at ${hub.ip} seen last ${diff}ms ago. clean up and tell subscribers that we lost that one.`);
                this.knownHubs.delete(hub.uuid);
                this.emit(ExplorerEvents.OFFLINE, hub);
                this.emit(ExplorerEvents.UPDATE, arrayOfKnownHubs(this.knownHubs));
            }
        });
    }
}
exports.Explorer = Explorer;
//# sourceMappingURL=explorer.js.map