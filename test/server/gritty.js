import {stripVTControlCharacters} from 'node:util';
import process from 'node:process';
import {once} from 'node:events';
import {tryCatch} from 'try-catch';
import {test, stub} from 'supertape';
import currify from 'currify';
import {io} from 'socket.io-client';
import wait from '@iocmd/wait';
import serveOnce from 'serve-once';
import {gritty} from '#gritty/server';
import {connect} from '../before.js';

const {request} = serveOnce(gritty);

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
    
    await once(socket, 'connect');
    socket.emit('terminal', {
        command: 'bash -c "hello world"',
    });
    
    const [data] = await once(socket, 'data');
    socket.close();
    done();
    
    t.match(data, 'bash: line 1: hello: command not found');
    t.end();
});

test('gritty: server: terminal: platform', async (t) => {
    const platform = 'win32';
    const {port, done} = await connect();
    const socket = io(`http://localhost:${port}/gritty`);
    
    await once(socket, 'connect');
    socket.emit('terminal', {
        platform,
    });
    
    const [data] = await once(socket, 'data');
    socket.close();
    done();
    
    const stripped = stripVTControlCharacters(data);
    
    t.equal(stripped, 'bash-5.2$ ');
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
