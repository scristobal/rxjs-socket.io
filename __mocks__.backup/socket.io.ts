jest.mock('socket.io');

type Listener = (payload: [eventName: string, ...args: unknown[]]) => void;

class Server {
    connect: () => void;
    disconnect: () => void;
    onAny: (listener: Listener) => void;
    on: (Listener: Listener) => void;
    emit: (eventName: string, args: unknown[]) => void;
}

export { Server };
