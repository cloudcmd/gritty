'use strict';

const test = require('tape');
const promisify = require('es6-promisify');
const request = require('request');
const io = require('socket.io-client');

const before = require('../before');

const get = promisify((url, fn) => {
    fn(null, request(url));
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

test('gritty: server: socket: data', (t) => {
    before((port, after) => {
        const socket = io(`http://localhost:${port}/gritty`);
        
        socket.once('connect', () => {
            socket.emit('terminal');
            socket.once('data', () => {
                socket.close();
                t.pass('should emit data');
                after();
                t.end();
            });
        });
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

function clean(name) {
    delete require.cache[require.resolve(name)];
}

