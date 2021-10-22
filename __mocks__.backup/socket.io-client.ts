jest.mock('socket.io-client');

type Listener = (payload: [eventName: string, ...args: unknown[]]) => void;

class io {
    connect: () => void;
    disconnect: () => void;
    onAny: (listener: Listener) => void;
    on: (Listener: Listener) => void;
    emit: (eventName: string, args: unknown[]) => void;
}

export { io };
