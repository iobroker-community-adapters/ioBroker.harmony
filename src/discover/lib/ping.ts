import * as dgram from 'node:dgram';

export class PingOptions {
    port?: number;
    address?: string | Array<string>;
    /** Local interface IP to bind the UDP socket to. Undefined = let the OS pick. */
    bindAddress?: string;
    interval?: number;
    logger?: (text: string) => void;
    /** Called on a socket error (e.g. bind failure). Lets the owner surface it at warn level. */
    onError?: (err: Error) => void;
}

export class Ping {
    /** Both only exist between start() and stop(). */
    private socket: dgram.Socket | undefined;
    private readonly portToAnnounce: number;

    private readonly message: string;
    private readonly messageBuffer: Buffer;
    private intervalToken: NodeJS.Timeout | undefined;

    private readonly options: PingOptions;
    private readonly logger: (text: string) => void;

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

        // Held in a local: inside the callback the compiler cannot know that this.socket is
        // still the same one, and stop() may well have cleared it by then.
        const socket = this.socket;
        if (!socket) {
            return;
        }

        (this.options.address as Array<string>).forEach(address =>
            socket.send(this.messageBuffer, 0, this.message.length, this.options.port, address, err => {
                // Per-address failure only: one unreachable target (a hub that is switched
                // off, a route that is down) must not stop the pings for every other one.
                if (err) {
                    this.logger(`error emitting ping to ${address}: ${err.message}`);
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
            // Always allow broadcast destinations. The option only *permits* sending to a
            // broadcast address and changes nothing for unicast, so leaving it off would
            // only turn a manually configured broadcast address into an EACCES per ping.
            this.socket?.setBroadcast(true);
        });
        this.socket.unref();

        this.intervalToken = setInterval(() => this.emit(), this.options.interval);
    }

    /**
     * Stop the ping interval and close the socket.
     */
    stop(): void {
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
            this.socket?.close();
        } catch (err) {
            this.logger(`socket close failed: ${(err as Error)?.message ?? err}`);
        }
        this.socket = undefined;
    }

    isRunning(): boolean {
        return this.intervalToken !== undefined;
    }
}
