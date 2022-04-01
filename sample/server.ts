import { fromSocketIOServer } from '../src/index';

const connection$ = fromSocketIOServer(3000);

connection$.subscribe(({ from, to }) => {
    to('hello').next('world');
    from('howdy').subscribe(console.log);
});
