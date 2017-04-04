'use strict';

const test = require('tape');
const sinon = require('../sinon');

require('css-modules-require-hook/preset');

global.window = {
    addEventListener: sinon.stub(),
};


const mock = require('mock-require');

const connect = sinon.stub().returns({
    on: sinon.stub(),
});

const Terminal = sinon.stub().returns({
    open: sinon.stub(),
    fit: sinon.stub(),
    on: sinon.stub(),
    proposeGeometry: sinon.stub().returns({
        cols: 80,
        rows: 25,
    }),
});

mock('socket.io-client/dist/socket.io.min', {
    connect,
});

mock('xterm/dist/xterm', Terminal);

const gritty = require('../../client/gritty');

test('gritty: Terminal: new', (t) => {
    before();
    
    gritty();
    t.ok(Terminal.calledWithNew(), 'should have been called with new');
    after();
    
    t.end();
});

test('gritty: Terminal: args', (t) => {
    before();
    const args = {
        scrollback: 1000,
        tabStopWidth: 4,
        theme: 'gritty',
    };
    
    gritty();
    
    t.ok(Terminal.calledWith(args), 'should have been called with args');
    
    after();
    t.end();
});

function before() {
    global.location = {};
}

function after() {
    delete global.location;
}
