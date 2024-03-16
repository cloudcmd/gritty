'use strict';

const process = require('node:process');
const tryCatch = require('try-catch');

const {once} = require('events');

const {test, stub} = require('supertape');

const currify = require('currify');
const io = require('socket.io-client');
const mockRequire = require('mock-require');
const wait = require('@iocmd/wait');

const gritty = require('../../');
const serveOnce = require('serve-once');

const {connect} = require('../before');

const {request} = serveOnce(gritty);

const {reRequire, stopAll} = mockRequire;

test('gritty: listen: args: no', (t) => {
    const [error] = tryCatch(gritty.listen);
    
    t.equal(error.message, 'socket could not be empty!', 'should throw when no args');
    t.end();
});

test('gritty: listen: args: auth', (t) => {
    const socket = {};
    
    socket.on = stub().returns(socket);
    socket.of = stub().returns(socket);
    
    const [error] = tryCatch(gritty.listen, socket, {
        auth: 'hello',
    });
    
    t.equal(error.message, 'options.auth should be a function!', 'should throw when no args');
    t.end();
});

test('gritty: server: dist-dev', async (t) => {
    process.env.NODE_ENV = 'development';
    
    const gritty = reRequire('../..');
    const {request} = serveOnce(gritty);
    
    const {status} = await request.get('/gritty/gritty.js');
    delete process.env.NODE_ENV;
    
    t.equal(status, 200, 'should return OK');
    t.end();
});

test('gritty: server: dist', async (t) => {
    const {status} = await request.get(`/gritty/gritty.js`);
    
    t.equal(status, 200, 'should return OK');
    t.end();
});

test('gritty: server: dist: not found', async (t) => {
    const {status} = await request.get('/gritty/not-found.js');
    
    t.equal(status, 404, 'should return Not Found');
    t.end();
});

test('gritty: server: socket: resize', async (t) => {
    const {port, done} = await connect();
    const socket = io(`http://localhost:${port}/gritty`);
    
    await once(socket, 'connect');
    socket.emit('terminal');
    socket.emit('resize');
    
    await once(socket, 'data');
    socket.close();
    done();
    
    t.pass('should emit data');
    t.end();
});

test('gritty: server: socket: resize: terminal options', async (t) => {
    const {port, done} = await connect();
    const socket = io(`http://localhost:${port}/gritty`);
    
    await once(socket, 'connect');
    socket.emit('terminal', {
        autoRestart: true,
    });
    
    socket.emit('resize');
    
    await once(socket, 'data');
    socket.close();
    done();
    
    t.pass('should emit data');
    t.end();
});

test('gritty: server: socket: exit', async (t) => {
    const {port, done} = await connect();
    const socket = io(`http://localhost:${port}/gritty`);
    
    await once(socket, 'connect');
    socket.emit('terminal');
    
    await once(socket, 'data');
    
    socket.emit('data', 'e');
    socket.emit('data', 'x');
    socket.emit('data', 'i');
    socket.emit('data', 't');
    socket.emit('data', String.fromCharCode(13));
    
    await once(socket, 'exit');
    socket.close();
    done();
    
    t.pass('should exit terminal');
    t.end();
});

test('gritty: server: socket: exit: custom cmd', async (t) => {
    const {port, done} = await connect({
        command: 'ls',
        autoRestart: false,
    });
    
    const socket = io(`http://localhost:${port}/gritty`);
    
    await once(socket, 'connect');
    socket.emit('terminal');
    
    socket.emit('data', 'e');
    socket.emit('data', 'x');
    socket.emit('data', 'i');
    socket.emit('data', 't');
    socket.emit('data', String.fromCharCode(13));
    
    await once(socket, 'exit');
    socket.close();
    done();
    
    t.pass('should exit terminal');
    t.end();
});

test('gritty: server: terminal: parse args', async (t) => {
    const {port, done} = await connect();
    const socket = io(`http://localhost:${port}/gritty`);
    
    mockRequire('@lydell/node-pty', {
        spawn: stub(),
    });
    
    await once(socket, 'connect');
    socket.emit('terminal', {
        command: 'bash -c "hello world"',
    });
    
    const [data] = await once(socket, 'data');
    socket.close();
    done();
    
    stopAll();
    
    t.match(data, 'bash: hello: command not found');
    t.end();
});

test('gritty: server: socket: emit data', async (t) => {
    const {port, done} = await connect();
    const socket = io(`http://localhost:${port}/gritty`);
    
    await once(socket, 'connect');
    socket.emit('terminal');
    socket.emit('data', 'hello');
    
    const [data] = await once(socket, 'data');
    socket.close();
    done();
    
    t.equal(data, 'hello', 'should equal data');
    t.end();
});

test('gritty: server: socket: auth', async (t) => {
    const auth = currify((accept, reject, username, password) => {
        if (username !== 'hello' || password !== 'world')
            return reject();
        
        accept();
    });
    
    const {port, done} = await connect({
        auth,
    });
    const socket = io(`http://localhost:${port}/gritty`);
    
    await once(socket, 'connect');
    
    socket.emit('auth', 'hello', 'world');
    
    await once(socket, 'accept');
    socket.close();
    done();
    
    t.pass('should emit accepet');
    t.end();
});

test('gritty: server: socket: auth: reject', async (t) => {
    const auth = currify((accept, reject, username, password) => {
        if (username !== 'hello' || password !== 'world')
            return reject();
        
        accept();
    });
    
    const {port, done} = await connect({
        auth,
    });
    const socket = io(`http://localhost:${port}/gritty`);
    
    await once(socket, 'connect');
    
    socket.emit('auth', 'hello', 'hello');
    
    await once(socket, 'reject');
    socket.close();
    done();
    
    t.pass('should emit reject');
    t.end();
});

test('gritty: server: platform', (t) => {
    const {platform} = process;
    
    Object.defineProperty(process, 'platform', {
        value: 'win32',
    });
    
    reRequire('../..');
    
    t.pass('set CMD');
    
    Object.defineProperty(process, 'platform', {
        value: platform,
    });
    
    t.end();
});

test('gritty: server: socket: authCheck', async (t) => {
    const auth = (connect, reject) => ({username, password}) => {
        if (username !== 'hello' || password !== 'world')
            return reject();
        
        connect();
    };
    
    const {port, done} = await connect({
        auth,
    });
    const socket = io(`http://localhost:${port}/gritty`);
    
    await once(socket, 'connect');
    
    const emit = socket.emit.bind(socket);
    emit('auth', {
        username: 'hello',
        password: 'world',
    });
    
    await Promise.all([
        once(socket, 'accept'),
        wait(emit, 'auth', {
            username: 'hello',
            password: 'world',
        }),
    ]);
    
    socket.close();
    done();
    
    t.pass('should emit accepet');
    t.end();
});
