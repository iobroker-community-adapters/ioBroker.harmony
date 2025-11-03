import { EventEmitter } from 'node:events';
import * as net from 'node:net';

export enum ResponseCollectorEvents {
    RESPONSE = 'response',
}

export class ResponseCollector extends EventEmitter {
    port: number;
    server: net.Server;
    private readonly logger: (text: string) => void;

    /**
     * @param port Port number on this client to use for the tcp server.
     * @param logger Optional logger function.
     */
    constructor(port: number, logger: (text: string) => void) {
        super();
        this.logger = logger;
        this.logger(
            `Be aware that port ${port} needs to be reachable on your machine in order to discover harmony hubs.`,
        );
        this.logger(`ResponseCollector(${port})`);

        this.port = port;
    }

    /**
     * Set up a tcp server to listen for hub messages and emit a
     * response when the message is done.
     */
    start(): void {
        this.logger('start()');

        this.server = net
            .createServer(socket => {
                this.logger('handle new connection');

                let buffer = '';

                socket.on('data', data => {
                    this.logger('received data chunk');
                    buffer += data.toString();
                });

                socket.on('end', () => {
                    this.logger('connection closed. emitting data.');
                    this.emit(ResponseCollectorEvents.RESPONSE, buffer);
                });
            })
            .listen(this.port);
    }

    /**
     * Close the tcp server.
     */
    stop(): void {
        this.logger('stop()');

        if (this.server) {
            this.server.close();
        } else {
            this.logger('not running');
        }
    }
}
