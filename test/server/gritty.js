'use strict';

const test = require('tape');
const {promisify} = require('es6-promisify');
const request = require('request');
const io = require('socket.io-client');
const diff = require('sinon-called-with-diff');
const sinon = diff(require('sinon'));

const gritty = require('../../');
const before = require('../before');

const get = promisify((url, fn) => {
    fn(null, request(url));
});

test('gritty: listen: args: no', (t) => {
    t.throws(gritty.listen, /socket could not be empty!/, 'should throw when no args');
    t.end();
});

test('gritty: listen: args: authCheck', (t) => {
    const socket = {};
    const on = sinon.stub().returns(socket)
    const of = sinon.stub().returns(socket);
    
    socket.on = on;
    socket.of = of;
    
    const fn = () => gritty.listen(socket, {
        authCheck: 'hello'
    });
    
    t.throws(fn, /options.authCheck should be a function!/, 'should throw when no args');
    
    t.end();
});

test('gritty: server: dist-dev', (t) => {
    clean('../../');
    clean('../before');
    
    process.env.NODE_ENV = 'development';
    
    const before = require('../before');
    
    delete process.env.NODE_ENV;
    
    before((port, after) => {
        const name = 'gritty';
        
        get(`http://localhost:${port}/${name}/${name}.js`)
            .then((res) => {
                res.on('response', ({statusCode}) => {
                    t.equal(statusCode, 200, 'should return OK');
                }).on('end', () => {
                    t.end();
                    after();
                });
        })
        .catch(console.error);
    });
});

test('gritty: server: dist', (t) => {
    before((port, after) => {
        const name = 'gritty';
        
        get(`http://localhost:${port}/${name}/${name}.js`)
            .then((res) => {
                res.on('response', ({statusCode}) => {
                    t.equal(statusCode, 200, 'should return OK');
                }).on('end', () => {
                    t.end();
                    after();
                });
        })
        .catch(console.error);
    });
});

test('gritty: server: dist: not found', (t) => {
    before((port, after) => {
        const name = 'gritty';
        
        get(`http://localhost:${port}/${name}/not-found.js`)
            .then((res) => {
                res.on('response', ({statusCode}) => {
                    t.equal(statusCode, 404, 'should return Not Found');
                }).on('end', () => {
                    t.end();
                    after();
                });
        })
        .catch(console.error);
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

        serverIo.use(function(socket, next) {
            socket.request.env = {
                NODE_VAR: 'GRITTY_ENV_TEST'
            };

            next();
        });

        clientIo.once('connect', () => {
            clientIo.emit('terminal');
            clientIo.emit('data', 'echo "$NODE_VAR"');
            clientIo.emit('data', String.fromCharCode(13));

            clientIo.on('data', (data) => {
                let result = /\r?\n(GRITTY_ENV_TEST)\r?\n/.exec(data);
                if(result && result[1] === "GRITTY_ENV_TEST") {
                    t.pass('should print GRITTY_ENV_TEST with emitted data');
                    clientIo.close();
                    after();
                    t.end();
                }
            });
        });
    });
});

function clean(name) {
    delete require.cache[require.resolve(name)];
}

