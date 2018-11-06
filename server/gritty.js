'use strict';

const DIR_ROOT = __dirname + '/..';

const path = require('path');
const log = require('debug')('gritty');

const Router = require('router');
const currify = require('currify');
const wraptile = require('wraptile');
const pty = require('node-pty');

const terminalFn = currify(_terminalFn);
const connectionWraped = wraptile(connection);

const CMD = process.platform === 'win32' ? 'cmd.exe' : 'bash';
const isDev = process.env.NODE_ENV === 'development';

const getDist = () => {
    if (isDev)
        return '/dist-dev';
    
    return '/dist';
};

module.exports = (options = {}) => {
    const router = Router();
    const prefix = options.prefix || '/gritty';
    
    router.route(prefix + '/*')
        .get(terminalFn(options))
        .get(staticFn);
    
    return router;
};

function _terminalFn(options, req, res, next) {
    const o = options;
    const prefix = o.prefix || '/gritty';
    
    req.url = req.url.replace(prefix, '');
    
    if (/^\/gritty\.js(\.map)?$/.test(req.url))
        req.url = getDist() + req.url;
    
    next();
}

function staticFn(req, res) {
    const file = path.normalize(DIR_ROOT + req.url);
    res.sendFile(file);
}

function createTerminal({command, env, cols, rows}) {
    cols = cols || 80;
    rows = rows || 24;
    
    const term = pty.spawn(command, [], {
        name: 'xterm-color',
        cols,
        rows,
        cwd: process.env.PWD,
        env: {
            ...process.env,
            ...env
        }
    });
    
    log(`Created terminal with PID: ${term.pid}`);
    
    return term;
}

module.exports.listen = (socket, options = {}) => {
    check(socket, options);
    
    const {
        prefix,
        auth,
    } = options;
    
    socket
        .of(prefix || '/gritty')
        .on('connection', (socket) => {
            const connect = connectionWraped(options, socket);
            
            if (!auth)
                return connection(options, socket);
            
            const reject = () => socket.emit('reject');
            socket.on('auth', auth(connect, reject));
        });
};

function check(socket, options) {
    if (!socket)
        throw Error('socket could not be empty!');
    
    const {auth} = options;
    
    if (auth && typeof auth !== 'function')
        throw Error('options.auth should be a function!');
}

function connection(options, socket) {
    socket.emit('accept');
    
    const command = options.command || CMD;
    const {
        autoRestart = true,
    } = options;
    
    let term;
    
    socket.on('terminal', onTerminal);
    
    const onResize = (size) => {
        size = size || {};
        
        const cols = size.cols || 80;
        const rows = size.rows || 25;
        
        term.resize(cols, rows);
        log(`Resized terminal ${term.pid} to ${cols} cols and ${rows} rows.`);
    };
    
    const onData = (msg) => {
        term.write(msg);
    };
    
    const onExit = () => {
        socket.emit('exit');
        onDisconnect();
        
        if (!autoRestart)
            return;
        
        onTerminal();
    };
      
    function onTerminal(params) {
        params = params || {};
        
        const env = {
            ...params.env,
            ...socket.request.env,
        };
        const rows = params.rows;
        const cols = params.cols;
        
        term = createTerminal({
            command,
            env,
            rows,
            cols,
        });
        
        term.on('data', (data) => {
            socket.emit('data', data);
        });
        
        term.on('exit', onExit);
        
        log('Connected to terminal ' + term.pid);
        
        socket.on('data', onData);
        socket.on('resize', onResize);
        socket.on('disconnect', onDisconnect);
    }
    
    const onDisconnect = () => {
        term.removeListener('exit', onExit);
        term.kill();
        log(`Closed terminal ${term.pid}`);
        
        socket.removeListener('resize', onResize);
        socket.removeListener('data', onData);
        socket.removeListener('terminal', onTerminal);
        socket.removeListener('disconnect', onDisconnect);
    };
}

