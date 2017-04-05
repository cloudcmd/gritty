'use strict';

const test = require('tape');
const sinon = require('../sinon');

const timeout = require('../../client/timeout');

test('gritty: timeout', (t) => {
    const fn = timeout(() => {
        t.pass('should have been called');
        t.end();
    });
    
    fn();
});

test('gritty: timeout', (t) => {
    const {setTimeout} = global;
    const fn = () => {};
    
    global.setTimeout = sinon.stub();
    
    const f = timeout(fn);
    f();
    
    t.ok(global.setTimeout.calledWith(fn), 'should call setTimeout');
    global.setTimeout = setTimeout;
    t.end();
});

