'use strict';

const gritty  = require('../');
const http = require('http');

const express = require('express');
const io = require('socket.io');

module.exports = (options, fn = options) => {
    if (typeof options === 'function')
        options = {};
     
    const app = express();
    const server = http.createServer(app);
    const after = () => {
        server.close();
    };
    
    app.use(gritty())
    
    const socket = io.listen(server);
    
    gritty.listen(socket, options);
    
    server.listen(() => {
        fn(server.address().port, after, socket);
    });
};

