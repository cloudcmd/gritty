'use strict';

const {on, once} = require('events');

const test = require('supertape');
const currify = require('currify');
const io = require('socket.io-client');
const stub = require('@cloudcmd/stub');
const mockRequire = require('mock-require');
const wait = require('@iocmd/wait');
const {reRequire} = mockRequire;

const gritty = require('../../');
const serveOnce = require('serve-once');
const {request} = serveOnce(gritty);

const {connect} = require('../before');

test('gritty: listen: args: no', (t) => {
    t.throws(gritty.listen, /socket could not be empty!/, 'should throw when no args');
    t.end();
});

test('gritty: listen: args: auth', (t) => {
    const socket = {};
    const on = stub().returns(socket);
    const of = stub().returns(socket);
    
    socket.on = on;
    socket.of = of;
    
    const fn = () => gritty.listen(socket, {
        auth: 'hello',
    });
    
    t.throws(fn, /options.auth should be a function!/, 'should throw when no args');
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

test('gritty: server: terminal: parse args', async (t) => {
    const {port, done} = await connect();
    const socket = io(`http://localhost:${port}/gritty`);
    
    mockRequire('node-pty', {
        spawn: stub(),
    });
    
    await once(socket, 'connect');
    socket.emit('terminal', {
        command: 'bash -c "hello world"',
    });
    
    const [data] = await once(socket, 'data');
    socket.close();
    done();
    
    t.ok(data.includes('bash: hello: command not found'));
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
    
    const {port, done} = await connect({auth});
    const socket = io(`http://localhost:${port}/gritty`);
    
    await once(socket, 'connect');
    
    socket.emit('auth', 'hello', 'world');
    
    await once(socket, 'accept');
    socket.close();
    done();
    
    t.pass('should emit accepet');
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

test('gritty: server: socket: test env', async (t) => {
    const {
        port,
        done,
        socket,
    } = await connect();
    
    const clientIo = io(`http://localhost:${port}/gritty`);
    
    socket.use((socket, next) => {
        socket.request.env = {
            NODE_VAR: 'HELLO',
        };
        
        next();
    });
    
    await once(clientIo, 'connect');
    
    clientIo.emit('terminal');
    clientIo.emit('data', 'echo _env_"$NODE_VAR"_env_');
    clientIo.emit('data', String.fromCharCode(13));
    
    for await (const [data] of on(clientIo, 'data')) {
        const result = /\r?\n(_env_HELLO_env_)\r?\n/.exec(data);
        const noEnvResult = /\r?\n(_env__env_)\r?\n/.exec(data);
        
        if (!result && !noEnvResult)
            continue;
        
        const [, env] = result || [];
        const [, noEnv] = noEnvResult || [];
        
        if (env === '_env_HELLO_env_') {
            clientIo.close();
            done();
            
            t.pass('set socket.request.env');
            break;
        }
        
        if (noEnv === '_env__env_') {
            clientIo.close();
            done();
            
            t.fail('set socket.request.env');
            break;
        }
    }
    
    t.end();
});

test('gritty: server: socket: authCheck', async (t) => {
    const auth = (connect, reject) => ({username, password}) => {
        if (username !== 'hello' || password !== 'world')
            return reject();
        
        connect();
    };
    
    const {port, done} = await connect({auth});
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

