'use strict';

const path = require('path');

const log = require('debug')('gritty');
const Router = require('router');

const currify = require('currify');
const wraptile = require('wraptile');
const pty = require('node-pty');
const stringArgv = require('string-to-argv');
const isBool = (a) => typeof a === 'boolean';

const DIR_ROOT = __dirname + '/..';

const terminalFn = currify(_terminalFn);
const connectionWraped = wraptile(connection);

const CMD = process.platform === 'win32' ? 'cmd.exe' : 'bash';
const isDev = process.env.NODE_ENV === 'development';

const getDist = () => {
    if (isDev)
        return '/dist-dev';
    
    return '/dist';
};

const choose = (a, b, options) => {
    if (isBool(a))
        return a;
    
    if (isBool(b))
        return b;
    
    return options.default;
};

module.exports = (options = {}) => {
    const router = Router();
    const {
        prefix = '/gritty',
    } = options;
    
    router.route(prefix + '/*')
        .get(terminalFn(options))
        .get(staticFn);
    
    return router;
};

function _terminalFn(options, req, res, next) {
    const {
        prefix = '/gritty',
    } = options;
    
    req.url = req.url.replace(prefix, '');
    
    if (/^\/gritty\.js(\.map)?$/.test(req.url))
        req.url = getDist() + req.url;
    
    next();
}

function staticFn(req, res) {
    const file = path.normalize(DIR_ROOT + req.url);
    res.sendFile(file);
}

function createTerminal({command, env, cwd, cols, rows}) {
    cols = cols || 80;
    rows = rows || 24;
    
    const [cmd, ...args] = stringArgv(command);
    const term = pty.spawn(cmd, args, {
        name: 'xterm-color',
        cols,
        rows,
        cwd,
        env: {
            ...process.env,
            ...env,
        },
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
    
    let term;
    
    socket.on('terminal', onTerminal);
    
    const onResize = (size) => {
        size = size || {};
        
        const {
            cols = 80,
            rows = 25,
        } = size;
        
        term.resize(cols, rows);
        log(`Resized terminal ${term.pid} to ${cols} cols and ${rows} rows.`);
    };
    
    const onData = (msg) => {
        term.write(msg);
    };
    
    function onTerminal(params) {
        params = params || {};
        const {
            env,
            rows,
            cols,
            cwd,
        } = params;
        
        const command = params.command || options.command || CMD;
        const autoRestart = choose(params.autoRestart, options.autoRestart, {
            default: true,
        });
        
        term = createTerminal({
            command,
            cwd,
            env,
            rows,
            cols,
        });
        
        const onExit = (code) => {
            socket.emit('exit', code);
            onDisconnect();
            
            if (!autoRestart)
                return;
            
            onTerminal();
        };
        
        const onDisconnect = () => {
            term.removeListener('exit', onExit);
            term.kill();
            log(`Closed terminal ${term.pid}`);
            
            socket.removeListener('resize', onResize);
            socket.removeListener('data', onData);
            socket.removeListener('terminal', onTerminal);
            socket.removeListener('disconnect', onDisconnect);
        };
        
        term.on('data', (data) => {
            socket.emit('data', data);
        });
        
        term.on('exit', onExit);
        
        log('Connected to terminal ' + term.pid);
        
        socket.on('data', onData);
        socket.on('resize', onResize);
        socket.on('disconnect', onDisconnect);
    }
}

