import process from 'node:process';
import path, {dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import debug from 'debug';
import Router from 'router';
import currify from 'currify';
import wraptile from 'wraptile';
import _pty from 'node-pty';
import stringArgv from 'string-to-argv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const log = debug('gritty');
const isFn = (a) => typeof a === 'function';
const isBool = (a) => typeof a === 'boolean';

const DIR_ROOT = `${__dirname}/..`;

const terminalFn = currify(_terminalFn);
const connectionWraped = wraptile(connection);

const getCMD = (overrides = {}) => {
    const {platform = process.platform} = overrides;
    
    return platform === 'win32' ? 'cmd.exe' : 'bash';
};

const isDev = () => process.env.NODE_ENV === 'development';

const getDist = () => {
    if (isDev())
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

export const gritty = (options = {}) => {
    const router = Router();
    const {prefix = '/gritty'} = options;
    
    router
        .route(`${prefix}/*name`)
        .get(terminalFn(options))
        .get(staticFn);
    
    return router;
};

function _terminalFn(options, req, res, next) {
    const {prefix = '/gritty'} = options;
    
    req.url = req.url.replace(prefix, '');
    
    if (/^\/gritty\.js(\.map)?$/.test(req.url))
        req.url = getDist() + req.url;
    
    next();
}

function staticFn(req, res) {
    const file = path.normalize(DIR_ROOT + req.url);
    
    res.sendFile(file, {
        dotfiles: 'allow',
    });
}

function createTerminal(overrides = {}) {
    const {
        command,
        env,
        cwd,
        cols = 80,
        rows = 24,
        pty = _pty,
    } = overrides;
    
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

gritty.listen = (socket, options = {}) => {
    check(socket, options);
    
    const {prefix, auth} = options;
    
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
    
    if (auth && !isFn(auth))
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
    
    function onTerminal(overrides = {}) {
        const {
            env,
            rows,
            cols,
            cwd,
            platform,
        } = overrides;
        
        const command = overrides.command || options.command || getCMD({
            platform,
        });
        
        const autoRestart = choose(overrides.autoRestart, options.autoRestart, {
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
