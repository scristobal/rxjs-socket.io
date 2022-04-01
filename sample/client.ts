import { fromSocketIOClient } from '../src';

const { from, to } = fromSocketIOClient('ws://localhost:3000');

from('hello').subscribe(console.log);
to('howdy').next('stranger');
