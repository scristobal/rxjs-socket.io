# rxjs-socket.io

A simple RxJS wrapper for Socket.IO

## Basic example

The following example is the same as in Socket.IO [welcome page](https://socket.io/)

```typescript
import { fromSocketIOServer } from 'rxjs-socket.io';

const connection$ = fromSocketIOServer(3000);

connection$.subscribe(({ from, to }) => {
    to('hello').next('world');
    from('howdy').subscribe(console.log);
});
```

```typescript
import { fromSocketIOClient } from 'rxjs-socket.io';

const { from, to } = fromSocketIOClient('ws://localhost:3000');

from('hello').subscribe(console.log);
to('howdy').next('stranger');
```

## Disclaimer

This library is still under development, many functionalities are missing and the public API is not yet stable.
