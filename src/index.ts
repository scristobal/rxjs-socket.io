import { Observable, Observer, share } from 'rxjs';
import { Server, ServerOptions } from 'socket.io';
import { io as ioClient, ManagerOptions, SocketOptions } from 'socket.io-client';

import http from 'http';

type JSONObject = { [key: string]: JSON };
type JSONArray = Array<JSON>;
type JSON = null | string | number | boolean | JSONArray | JSONObject;

type FromSocket = (
    srv: undefined | Partial<ServerOptions> | http.Server | number,
    opts?: Partial<ServerOptions>
) => { message$$: Observable<unknown[]> };

function fromSocketServer(opts?: Partial<ServerOptions>): ReturnType<FromSocket>;
function fromSocketServer(srv?: http.Server | number, opts?: Partial<ServerOptions>): ReturnType<FromSocket>;
function fromSocketServer(
    srv: undefined | Partial<ServerOptions> | http.Server | number,
    opts?: Partial<ServerOptions>
) {
    const server = srv ? new Server(srv, opts) : new Server(opts);

    const message$ = new Observable<[string, unknown[]]>((subscriber) => {
        try {
            server.on('connection', (socket) =>
                socket.onAny((eventName: string, ...args) => subscriber.next([eventName, args]))
            );
            server.on('disconnect', () => subscriber.complete());
        } catch (error) {
            subscriber.error(error);
        }

        server.engine.on('connection_error', (error: Error) => {
            subscriber.error(error.message);
        });
    });

    const message$$ = message$.pipe(share());

    const pushMessage: Observer<[eventName: string, ...args: unknown[]]> = {
        next: ([eventName, ...args]) => {
            server.emit(eventName, ...args);
        },
        complete: () => server.close(),
        error: (error) => console.error(error)
    };

    return { message$$, pushMessage };
}

type FromSocketClient = (
    uri: string | Partial<ManagerOptions & SocketOptions>,
    opts?: Partial<ManagerOptions & SocketOptions>
) => {
    pushMessage: Observer<[string, unknown[]]>;
};

function fromSocketClient(opts?: Partial<ManagerOptions & SocketOptions>): ReturnType<FromSocketClient>;
function fromSocketClient(uri: string, opts?: Partial<ManagerOptions & SocketOptions>): ReturnType<FromSocketClient>;
function fromSocketClient(
    uri?: string | Partial<ManagerOptions & SocketOptions>,
    opts?: Partial<ManagerOptions & SocketOptions>
) {
    const client = uri ? (opts ? ioClient(uri, opts) : ioClient(uri)) : ioClient(opts);

    client.connect();

    const message$ = new Observable<[eventName: string, ...args: unknown[]]>((subscriber) => {
        client.onAny((eventName: string, ...args: unknown[]) => {
            subscriber.next([eventName, ...args]);
        });

        client.on('connect_error', (error) => subscriber.error(error));
        client.on('disconnect', () => {
            subscriber.complete();
        });
    });

    const pushMessage: Observer<[string, unknown[]]> = {
        next: ([eventName, ...args]) => {
            client.emit(eventName, args);
        },
        error: () => {
            client.disconnect();
            console.error();
        },
        complete: () => {
            client.disconnect();
        }
    };

    const message$$ = message$.pipe(share());

    return { message$$, pushMessage };
}

export { fromSocketServer, fromSocketClient };
