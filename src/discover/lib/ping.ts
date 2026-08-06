import * as dgram from 'node:dgram';

export class PingOptions {
    port?: number;
    address?: string | Array<string>;
    /** Local interface IP to bind the UDP socket to. Undefined = let the OS pick. */
    bindAddress?: string;
    /** Whether to enable SO_BROADCAST on the socket. Default true (legacy behavior). */
    broadcast?: boolean;
    interval?: number;
    logger?: (text: string) => void;
    /** Called on a socket error (e.g. bind failure). Lets the owner surface it at warn level. */
    onError?: (err: Error) => void;
}

export class Ping {
    private socket: dgram.Socket;
    private readonly portToAnnounce: number;

    private readonly message: string;
    private readonly messageBuffer: Buffer;
    private intervalToken: NodeJS.Timeout;

    private readonly options: PingOptions;
    private readonly logger: (text: string) => void;
    private readonly broadcast: boolean;

    constructor(portToAnnounce: number, options?: PingOptions) {
        options ||= {};
        this.logger = options.logger || (() => {});
        options.address ||= ['255.255.255.255'];

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
    emit(): void {
        this.logger('emit()');

        (this.options.address as Array<string>).forEach(address =>
            this.socket.send(this.messageBuffer, 0, this.message.length, this.options.port, address, err => {
                if (err) {
                    this.logger(`error emitting ping. stopping now :( (${err})`);
                    this.stop();
                }
            }),
        );
    }

    /**
     * Start emitting discovery pings on an interval.
     */
    start(): void {
        this.logger('start()');

        if (this.socket) {
            this.logger('Ping is already running, call stop() first');
            return;
        }

        this.socket = dgram.createSocket('udp4');
        // Without this listener a bind failure (e.g. a stale bindAddress that is no longer a
        // local interface) would surface as an uncaught 'error' event and crash the adapter.
        this.socket.on('error', (err: Error) => {
            this.logger(`socket error: ${err.message}`);
            this.options.onError?.(err);
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
    stop(): void {
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

    isRunning(): boolean {
        return this.intervalToken !== undefined;
    }
}
