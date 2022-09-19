'use strict';

const http = require('http');

const {promisify} = require('util');
const express = require('express');

const io = require('socket.io');
const gritty = require('..');

const isFn = (a) => typeof a === 'function';

module.exports = before;

function before(options, fn = options) {
    if (isFn(options))
        options = {};
    
    const app = express();
    const server = http.createServer(app);
    const after = () => {
        server.close();
    };
    
    app.use(gritty());
    
    const socket = io(server);
    
    gritty.listen(socket, options);
    
    server.listen(() => {
        fn(server.address().port, after, socket);
    });
}

module.exports.connect = promisify((options, fn = options) => {
    before(options, (port, done, socket) => {
        fn(null, {port, done, socket});
    });
});
