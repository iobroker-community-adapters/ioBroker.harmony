import * as logger from 'debug';
const debug = logger('harmonyhub:discover:responsecollector');
import { EventEmitter } from 'node:events';
import * as net from 'node:net';
export var ResponseCollectorEvents;
(function (ResponseCollectorEvents) {
    ResponseCollectorEvents["RESPONSE"] = "response";
})(ResponseCollectorEvents || (ResponseCollectorEvents = {}));
export class ResponseCollector extends EventEmitter {
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
//# sourceMappingURL=responseCollector.js.map