'use strict';

const gritty  = require('../');
const http = require('http');

const express = require('express');
const io = require('socket.io');

module.exports = (fn) => {
    const app = express();
    const server = http.createServer(app);
    const after = () => {
        server.close();
    };
    
    app.use(gritty())
    
    const socket = io.listen(server);
    
    gritty.listen(socket);
    
    server.listen(() => {
        fn(server.address().port, after);
    });
};

