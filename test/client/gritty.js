'use strict';

const {test, stub} = require('supertape');

require('css-modules-require-hook/preset');

globalThis.document = {};
globalThis.self = {};
globalThis.addEventListener = stub();

const open = stub();
const focus = stub();

const Terminal = stub().returns({
    open,
    focus,
    writeln: stub(),
    cols: 80,
    rows: 25,
    loadAddon: stub(),
    onResize: stub(),
    onData: stub(),
});

Terminal.applyAddon = stub();

const gritty = require('../../client/gritty');
const connect = stub().returns({
    on: stub(),
});

const {
    _onConnect,
    _onDisconnect,
    _onData,
    _onTermResize,
    _onTermData,
    _onWindowResize,
    _defaultFontFamily,
} = gritty;

test('gritty: Terminal: new', (t) => {
    before();
    
    gritty(null, {
        connect,
        Terminal,
        WebglAddon: stub(),
    });
    t.ok(Terminal.calledWithNew(), 'should have been called with new');
    after();
    
    t.end();
});

test('gritty: Terminal: args', (t) => {
    const WebglAddon = stub();
    before();
    
    const args = {
        scrollback: 1000,
        tabStopWidth: 4,
        fontFamily: _defaultFontFamily,
        allowProposedApi: true,
    };
    
    gritty(null, {
        connect,
        Terminal,
        WebglAddon,
    });
    
    t.calledWith(Terminal, [args], 'should have been called with args');
    
    after();
    t.end();
});

test('gritty: Terminal: args: fontFamily', (t) => {
    before();
    
    const fontFamily = 'Droid Sans Mono';
    const el = {};
    const WebglAddon = stub();
    
    const args = {
        scrollback: 1000,
        tabStopWidth: 4,
        fontFamily,
        allowProposedApi: true,
    };
    
    gritty(el, {
        fontFamily,
        connect,
        Terminal,
        WebglAddon,
    });
    
    t.calledWith(Terminal, [args], 'should have been called with args');
    
    after();
    t.end();
});

test('gritty: Terminal: open', (t) => {
    const el = {};
    const WebglAddon = stub();
    
    before();
    
    gritty(el, {
        connect,
        Terminal,
        WebglAddon,
    });
    t.calledWith(open, [el], 'should have been called');
    after();
    
    t.end();
});

test('gritty: Terminal: focus', (t) => {
    const el = {};
    const WebglAddon = stub();
    
    before();
    
    gritty(el, {
        connect,
        Terminal,
        WebglAddon,
    });
    t.calledWithNoArgs(focus, 'should have been called');
    after();
    
    t.end();
});

test('gritty: onConnect: socket: resize', (t) => {
    const emit = stub();
    const socket = {
        emit,
    };
    
    const options = {
        cols: 80,
        rows: 25,
    };
    
    const fit = stub();
    
    _onConnect(socket, {fit}, options);
    
    t.calledWith(emit, ['resize', options], 'should call emit');
    t.end();
});

test('gritty: onConnect: socket: terminal', (t) => {
    const emit = stub();
    const socket = {
        emit: (...args) => {
            emit(...args);
            socket.emit = stub();
        },
    };
    
    const options = {
        env: {
            hello: 'world',
        },
        cols: 80,
        rows: 25,
        cwd: '/',
        command: 'bash',
        autoRestart: false,
    };
    
    const fit = stub();
    
    _onConnect(socket, {fit}, options);
    
    t.calledWith(emit, ['terminal', options], 'should call emit');
    t.end();
});

test('gritty: onDisconnect: terminal', (t) => {
    const writeln = stub();
    
    const msg = 'terminal disconnected...';
    
    _onDisconnect({
        writeln,
    });
    
    t.calledWith(writeln, [msg], 'should call terminal.writeln');
    t.end();
});

test('gritty: onData: terminal', (t) => {
    const write = stub();
    
    const data = 'hello';
    
    _onData({write}, data);
    
    t.calledWith(write, [data], 'should call terminal.write');
    t.end();
});

test('gritty: onTermResize: socket', (t) => {
    const emit = stub();
    
    const size = {
        cols: 80,
        rows: 25,
    };
    
    _onTermResize({emit}, size);
    
    t.calledWith(emit, ['resize', size], 'should call socket.emit');
    t.end();
});

test('gritty: onTermData: socket', (t) => {
    const emit = stub();
    
    const data = 'hello';
    
    _onTermData({emit}, data);
    
    t.calledWith(emit, ['data', data], 'should call socket.emit');
    t.end();
});

test('gritty: onWindowResize: terminal', (t) => {
    const fit = stub();
    
    _onWindowResize({
        fit,
    });
    
    t.calledWithNoArgs(fit, 'should call terminal.fit');
    t.end();
});

function before() {
    globalThis.location = {};
}

function after() {
    delete globalThis.location;
}
