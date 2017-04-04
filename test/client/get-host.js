'use strict';

const test = require('tape');
const sinon = require('../sinon');

const dir = '../../client';
const getHost = require(`${dir}/get-host`);

test('gritty: get-host: origin', (t) => {
    const origin = 'http://localhost';
    global.location = {
        origin
    }
    
    t.ok(getHost(), origin, 'should return origin');
    
    delete global.location;
    
    t.end();
});

test('gritty: get-host: no origin', (t) => {
    global.location = {
        protocol: 'http',
        host: 'localhost'
    }
    
    t.ok(getHost(), 'http://localhost', 'should return host');
    
    delete global.location;
    
    t.end();
});

