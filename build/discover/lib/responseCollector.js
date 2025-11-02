"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponseCollector = exports.ResponseCollectorEvents = void 0;
const logger = require("debug");
const debug = logger('harmonyhub:discover:responsecollector');
const node_events_1 = require("node:events");
const net = require("node:net");
var ResponseCollectorEvents;
(function (ResponseCollectorEvents) {
    ResponseCollectorEvents["RESPONSE"] = "response";
})(ResponseCollectorEvents || (exports.ResponseCollectorEvents = ResponseCollectorEvents = {}));
class ResponseCollector extends node_events_1.EventEmitter {
    port;
    server;
    /**
     * @param port Port number on this client to use for the tcp server.
     */
    constructor(port) {
        super();
        debug(`Be aware that port ${port} needs to be reachable on your machine in order to discover harmony hubs.`);
        debug(`ResponseCollector(${port})`);
        this.port = port;
    }
    /**
     * Set up a tcp server to listen for hub messages and emit a
     * response when the message is done.
     */
    start() {
        debug('start()');
        this.server = net
            .createServer(socket => {
            debug('handle new connection');
            let buffer = '';
            socket.on('data', data => {
                debug('received data chunk');
                buffer += data.toString();
            });
            socket.on('end', () => {
                debug('connection closed. emitting data.');
                this.emit(ResponseCollectorEvents.RESPONSE, buffer);
            });
        })
            .listen(this.port);
    }
    /**
     * Close the tcp server.
     */
    stop() {
        debug('stop()');
        if (this.server) {
            this.server.close();
        }
        else {
            debug('not running');
        }
    }
}
exports.ResponseCollector = ResponseCollector;
//# sourceMappingURL=responseCollector.js.map