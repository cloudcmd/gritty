'use strict';

const test = require('tape');
const diff = require('sinon-called-with-diff');
const sinon = diff(require('sinon'));

const dir = '../../client';
const getHost = require(`${dir}/get-host`);

test('gritty: get-host: origin', (t) => {
    const origin = 'http://localhost';
    global.location = {
        origin
    }
    
    t.equal(getHost(), origin, 'should return origin');
    
    delete global.location;
    
    t.end();
});

test('gritty: get-host: no origin', (t) => {
    global.location = {
        protocol: 'http:',
        host: 'localhost'
    }
    
    t.equal(getHost(), 'http://localhost', 'should return host');
    
    delete global.location;
    
    t.end();
});

