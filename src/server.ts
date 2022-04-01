import http from 'http';
import { fromEvent, map, Observable, Observer } from 'rxjs';
import { Server, ServerOptions, Socket } from 'socket.io';
import { EventNames, EventsMap } from 'socket.io/dist/typed-events';
import { ExtendedError } from 'socket.io/dist/namespace';

type JSONObject = { [key: string]: JSON };
type JSONArray = Array<JSON>;
type JSON = null | string | number | boolean | JSONArray | JSONObject;

export interface Connector<L extends EventsMap, S extends EventsMap> {
    from: <Ev extends EventNames<L>>(eventName: Ev) => Observable<EventParam<L, Ev>[0]>;
    to: <Ev extends EventNames<S>>(eventName: Ev) => Observer<Parameters<S[Ev]>[0]>;
    onDisconnect: (callback: () => void) => void;
    context: {
        socket: Socket<L, S>;
        server: Server<L, S>;
    };
}

type EventParam<L extends EventsMap, Ev extends EventNames<L>> = Parameters<L[Ev]>;

type EventListener<L extends EventsMap, Ev extends EventNames<L>> = L[Ev];

function fromSocketIOServer<L extends EventsMap, S extends EventsMap>(
    opts?: Partial<ServerOptions>
): Observable<Connector<L, S>>;
function fromSocketIOServer<L extends EventsMap, S extends EventsMap>(
    srv?: http.Server | number,
    opts?: Partial<ServerOptions>
): Observable<Connector<L, S>>;
function fromSocketIOServer<L extends EventsMap, S extends EventsMap>(
    srv?: undefined | Partial<ServerOptions> | http.Server | number,
    opts?: Partial<ServerOptions>,
    middleware?: (socket: Socket, next: (err?: ExtendedError) => void) => void
): Observable<Connector<L, S>> {
    const server = srv ? new Server<L, S>(srv, opts) : new Server<L, S>(opts);

    middleware && server.use(middleware);

    /* `fromEvent` can not infer the type of the observer and generics are getting deprecated, hence the casting */
    const socket$ = fromEvent(server, 'connection') as Observable<Socket<L, S>>;

    const connection$ = socket$.pipe(
        map((socket) => {
            function from<Ev extends EventNames<L>>(eventName: Ev) {
                // const eventNameStr = (typeof eventName === 'string')? eventName : eventName.toString()
                // const msg$ = fromEvent( socket, eventNameStr ) as Observable<EventParam<L, Ev>[0]>

                return new Observable<EventParam<L, Ev>[0]>((subscriber) => {
                    socket.on<Ev>(eventName, ((msg: EventParam<L, Ev>[0]) => {
                        subscriber.next(msg);
                    }) as EventListener<L, Ev>);
                    socket.on('disconnect', () => subscriber.complete());
                });
            }

            function to<Ev extends EventNames<S>>(eventName: Ev) {
                return {
                    next: (args: EventParam<S, Ev>[0]) => {
                        // @ts-expect-error: Somehow `.emit` transforms args into [args]
                        socket.emit(eventName, args);
                    },
                    complete: () => socket.disconnect(),
                    error: (error: Error) => console.error(error)
                };
            }

            const onDisconnect = (callback: () => void) => {
                socket.on('disconnect', callback);
            };

            const context = {
                socket,
                server
            };

            return { from, to, onDisconnect, context };
        })
    );

    return connection$;
}

export { fromSocketIOServer };
