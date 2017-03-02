'use strict';

const DIR_ROOT = __dirname + '/..';

const path = require('path');

const spawnify = require('spawnify/legacy');

const express = require('express');
const currify = require('currify/legacy');
const Router = express.Router;

const terminalFn = currify(_terminalFn);

const Console = require('./console');

const isDev = process.env.NODE_ENV === 'development';

const getDist = () => {
    if (isDev)
        return '/dist-dev';
    
    return '/dist';
}

module.exports = (options = {}) => {
    const router = Router();
    const prefix = options.prefix || '/gritty';
    
    router.route(prefix + '/*')
        .get(terminalFn(options))
        .get(staticFn)
    
    return router;
};

module.exports.listen = (socket, options) => {
    if (!options) {
        options = socket;
        socket = null
    }
    
    const o = options;
    
    if (!options.prefix)
        options.prefix = '/gritty';
    
    return Console(socket, {
        server: o.server,
        prefix: o.prefix,
        prompt: o.prompt,
        execute,
        authCheck: o.authCheck
    });
}

function _terminalFn(options, req, res, next) {
    const o = options || {};
    const prefix = o.prefix || '/gritty';
    const url = req.url
    
    if (url.indexOf(prefix))
        return next();
    
    req.url = url.replace(prefix, '');
    
    if (/^\/gritty\.js(\.map)?$/.test(req.url))
        req.url = getDist() + req.url;
    
    next();
}

function staticFn(req, res) {
    const file = path.normalize(DIR_ROOT + req.url);
    res.sendFile(file);
}

function execute(socket, command, cwd) {
    const cmd = command.cmd;
    const env = Object.assign({}, command.env, process.env);
    
    const spawn = spawnify(cmd, {
        env,
        cwd: cwd()
    });
    
    socket.on('kill', kill);
    socket.on('write', write);
    
    spawn.on('error', onError);
    spawn.on('data', onData);
    
    spawn.once('path', onPath);
    spawn.once('close', onClose);
    
    function kill() {
        spawn.kill();
    }
    
    function write(data) {
        spawn.write(data);
    }
    
    function onError(error) {
        socket.emit('err', error.message);
    }
    
    function onData(data) {
        socket.emit('data', data);
    }
    
    function onPath(path) {
        socket.emit('path', path);
        cwd(path);
    }
    
    function onClose() {
        socket.removeListener('kill', kill);
        socket.removeListener('write', write);
        
        spawn.removeListener('error', onError);
        spawn.removeListener('data', onData);
        
        socket.emit('prompt');
    }
}

