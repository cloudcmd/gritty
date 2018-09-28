'use strict';

const test = require('tape');
const {promisify} = require('util');
const currify = require('currify');
const request = require('request');
const io = require('socket.io-client');
const diff = require('sinon-called-with-diff');
const sinon = diff(require('sinon'));
const tryToCatch = require('try-to-catch');

const gritty = require('../../');
const before = require('../before');
const {connect} = before;

const get = promisify((url, fn) => {
    fn(null, request(url));
});

test('gritty: listen: args: no', (t) => {
    t.throws(gritty.listen, /socket could not be empty!/, 'should throw when no args');
    t.end();
});

test('gritty: listen: args: auth', (t) => {
    const socket = {};
    const on = sinon.stub().returns(socket)
    const of = sinon.stub().returns(socket);
    
    socket.on = on;
    socket.of = of;
    
    const fn = () => gritty.listen(socket, {
        auth: 'hello'
    });
    
    t.throws(fn, /options.auth should be a function!/, 'should throw when no args');
    
    t.end();
});

test('gritty: server: dist-dev', async (t) => {
    clean('../../');
    clean('../before');
    
    process.env.NODE_ENV = 'development';
    
    const {connect} = require('../before');
    
    delete process.env.NODE_ENV;
    
    const {port, done} = await connect();
    const name = 'gritty';
    
    const [e, res] = await tryToCatch(get, `http://localhost:${port}/${name}/${name}.js`);
    
    if (e) {
        done();
        t.fail(e.message);
        t.end();
        return;
    }
    
    res.on('response', ({statusCode}) => {
        t.equal(statusCode, 200, 'should return OK');
    }).on('end', () => {
        t.end();
        done();
    });
});

test('gritty: server: dist', async (t) => {
    const {port, done} = await connect();
    const name = 'gritty';
    
    const [e, res] = await tryToCatch(get, `http://localhost:${port}/${name}/${name}.js`)
    
    if (e) {
        done();
        t.fail(e.message);
        t.end();
        return;
    }
    
    res.on('response', ({statusCode}) => {
        t.equal(statusCode, 200, 'should return OK');
    }).on('end', () => {
        t.end();
        done();
    });
});

test('gritty: server: dist: not found', async (t) => {
    const {port, done} = await connect();
    const name = 'gritty';
    
    const [e, res] = await tryToCatch(get, `http://localhost:${port}/${name}/not-found.js`);
    
    if (e) {
        done();
        t.fail(e.message);
        t.end();
        return;
    }
    
    res.on('response', ({statusCode}) => {
        t.equal(statusCode, 404, 'should return Not Found');
    }).on('end', () => {
        done();
        t.end();
    });
});

test('gritty: server: socket: resize', (t) => {
    before((port, after) => {
        const socket = io(`http://localhost:${port}/gritty`);
        
        socket.once('connect', () => {
            socket.emit('terminal');
            socket.emit('resize');
            
            socket.once('data', () => {
                socket.close();
                t.pass('should emit data');
                after();
                t.end();
            });
        });
    });
});

test('gritty: server: socket: exit', (t) => {
    before((port, after) => {
        const socket = io(`http://localhost:${port}/gritty`);
        
        socket.once('connect', () => {
            socket.emit('terminal');
            socket.once('data', () => {
                socket.emit('data', 'e');
                socket.emit('data', 'x');
                socket.emit('data', 'i');
                socket.emit('data', 't');
                socket.emit('data', String.fromCharCode(13));
            });
            
            socket.on('exit', () => {
                t.pass('should exit terminal');
                socket.close();
                after();
                t.end();
            });
        });
    });
});

test('gritty: server: socket: exit: custom cmd', (t) => {
    const options = {
        command: 'ls',
        autoRestart: false,
    };
    
    before(options, (port, after) => {
        const socket = io(`http://localhost:${port}/gritty`);
        
        socket.once('connect', () => {
            socket.emit('terminal');
            socket.once('data', () => {
                socket.emit('data', 'e');
                socket.emit('data', 'x');
                socket.emit('data', 'i');
                socket.emit('data', 't');
                socket.emit('data', String.fromCharCode(13));
            });
            
            socket.on('exit', () => {
                t.pass('should exit terminal');
                socket.close();
                after();
                t.end();
            });
        });
    });
});

test('gritty: server: socket: emit data', (t) => {
    before((port, after) => {
        const socket = io(`http://localhost:${port}/gritty`);
        
        socket.once('connect', () => {
            socket.emit('terminal');
            socket.emit('data', 'hello');
            
            socket.on('data', (data) => {
                t.equal(data, 'hello', 'should equal data');
                socket.close();
                after();
                t.end();
            });
        });
    });
});

test('gritty: server: socket: auth', (t) => {
    const auth = currify((accept, reject, username, password) => {
        if (username !== 'hello' || password !== 'world')
            return reject();
        
        accept();
    });
    
    before({auth}, (port, after) => {
        const socket = io(`http://localhost:${port}/gritty`);
        
        socket.once('connect', () => {
            socket.emit('auth', 'hello', 'world');
            
            socket.on('accept', () => {
                socket.close();
                after();
                
                t.pass('should emit accepet');
                t.end();
            });
        });
    });
});

test('gritty: server: platform', (t) => {
    clean('../..');
    const {platform} = process;
    
    Object.defineProperty(process, 'platform', {
        value: 'win32'
    });
    
    const gritty = require('../..');
    
    t.pass('set CMD');
    
    Object.defineProperty(process, 'platform', {
        value: platform
    });
    
    t.end();
});

test('gritty: server: socket: test env', (t) => {
    before((port, after, serverIo) => {
        const clientIo = io(`http://localhost:${port}/gritty`);
        
        serverIo.use((socket, next) => {
            socket.request.env = {
                NODE_VAR: 'HELLO'
            };
            
            next();
        });
        
        clientIo.once('connect', () => {
            clientIo.emit('terminal');
            clientIo.emit('data', 'echo _env_"$NODE_VAR"_env_');
            clientIo.emit('data', String.fromCharCode(13));
            
            clientIo.on('data', (data) => {
                const result = /\r?\n(_env_HELLO_env_)\r?\n/.exec(data);
                const noEnvResult = /\r?\n(_env__env_)\r?\n/.exec(data);
                
                if (!result && !noEnvResult)
                    return;
                
                const [, env] = result || [];
                const [, noEnv] = noEnvResult || [];
                
                if (env === '_env_HELLO_env_') {
                    t.pass('set socket.request.env');
                    clientIo.close();
                    after();
                    t.end();
                    return;
                }
                
                if (noEnv === '_env__env_') {
                    t.fail('set socket.request.env');
                    clientIo.close();
                    after();
                    t.end();
                }
            });
        });
    });
});

test('gritty: server: socket: authCheck', (t) => {
    const authCheck = (socket, connection) => {
        socket.on('auth', ({username, password}) => {
            if (username !== 'hello' || password !== 'world')
                return socket.emit('reject');
            
            connection();
            socket.emit('accept');
        });
    };
    
    before({authCheck}, (port, after) => {
        const socket = io(`http://localhost:${port}/gritty`);
        
        socket.once('connect', () => {
            socket.emit('auth', {
                username: 'hello',
                password: 'world',
            });
            
            socket.on('accept', () => {
                t.pass('should emit accepet');
                socket.close();
                after();
                t.end();
            });
        });
    });
});

function clean(name) {
    delete require.cache[require.resolve(name)];
}
