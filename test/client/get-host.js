import {test} from 'supertape';
import getHost from '../../client/get-host.js';

test('gritty: get-host: origin', (t) => {
    const origin = 'http://localhost';
    
    globalThis.location = {
        origin,
    };
    
    t.equal(getHost(), origin, 'should return origin');
    
    delete globalThis.location;
    
    t.end();
});

test('gritty: get-host: no origin', (t) => {
    globalThis.location = {
        protocol: 'http:',
        host: 'localhost',
    };
    
    t.equal(getHost(), 'http://localhost', 'should return host');
    
    delete globalThis.location;
    
    t.end();
});
