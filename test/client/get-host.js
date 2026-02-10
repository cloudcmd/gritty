'use strict';

const {test} = require('supertape');

const dir = '../../client';
const getHost = require(`${dir}/get-host`);

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
