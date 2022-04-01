import { fromEvent, Observable, Observer } from 'rxjs';
import { io as ioClient, ManagerOptions, SocketOptions } from 'socket.io-client';

export interface Connector {
    from: (eventName: string) => Observable<unknown>;
    to: (eventName: string) => Observer<unknown>;
}

function fromSocketIOClient(opts?: Partial<ManagerOptions & SocketOptions>): Connector;
function fromSocketIOClient(uri: string, opts?: Partial<ManagerOptions & SocketOptions>): Connector;
function fromSocketIOClient(
    uri?: string | Partial<ManagerOptions & SocketOptions>,
    opts?: Partial<ManagerOptions & SocketOptions>
): Connector {
    const client = uri ? (opts ? ioClient(uri, opts) : ioClient(uri)) : ioClient(opts);

    client.connect();

    const from = (eventName: string) => fromEvent(client, eventName);

    const to = (eventName: string) => ({
        next: (data: unknown) => client.emit(eventName, data),
        complete: () => client.disconnect(),
        error: (error: Error) => console.log(error)
    });

    return { from, to };
}

export { fromSocketIOClient };
