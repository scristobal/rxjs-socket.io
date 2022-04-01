# rxio

A simple RxJS wrapper for Socket.IO

## Basic example

The following example is taken from [Socket.IO](https://socket.io/)

```typescript
import { fromSocketIOServer } from 'rxio';

const connection$ = fromSocketIOServer(3000);

connection$.subscribe(({ from, to }) => {
    to('hello').next('world');
    from('howdy').subscribe(console.log);
});
```

```typescript
import { fromSocketIOClient } from 'rxio';

const { from, to } = fromSocketIOClient('ws://localhost:3000');

from('hello').subscribe(console.log);
to('howdy').next('stranger');
```

## Disclaimer

This library is still in the early development phase, many functionalities are missing and the public API is not yet stable.
