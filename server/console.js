'use strict';

const io = require('socket.io');
const tildify = require('tildify');
const debug = require('debug');
const logConsole = debug('console');
const logClients = debug('console:clients');

const WIN = process.platform === 'win32';
const CWD = process.cwd();

const Clients = [];

let Socket;
let ConNum = -1;

module.exports = function(socket, options) {
    const o = options || {};
    const prefix  = o.prefix || '/console';
    
    if (socket)
        Socket = socket;
    else if (o.server)
        Socket = io.listen(o.server);
    else
        throw Error('server or socket should be passed in options!');
    
    Socket
        .of(prefix)
        .on('connection', (socket) => {
            const authCheck = options.authCheck;
           
            if (authCheck && typeof authCheck !== 'function')
                throw Error('options.authCheck should be function!');
            
            if (!authCheck)
                onConnection(options, socket);
            else
                authCheck(socket, () => {
                    onConnection(options, socket);
                });
        });
};

module.exports.getSocketPath = () => {
    return Socket.path();
};

function onConnection(options, socket) {
    const execute = options.execute;
    const indexEmpty = Clients.indexOf(null);
    
    logClients('add before:', Clients);
    
    if (indexEmpty >= 0)
        ConNum = indexEmpty;
    else
        ConNum = Clients.length;
    
    const msg = log(ConNum + 1, 'console connected\n');
    const dir = WIN ? CWD : tildify(CWD);
     
    socket.emit('data', msg);
    socket.emit('path', options.prompt || dir);
    socket.emit('prompt');
    
    Clients[ConNum] = {
        cwd: CWD
    };
    
    logClients('add after:', Clients);
    
    const onMessage = processing.bind(null, socket, ConNum, execute);
    const onDisconnect = function(conNum) {
        logClients('remove before:', Clients);
        
        if (Clients.length !== conNum + 1) {
            Clients[conNum] = null;
        } else {
            Clients.pop();
            --ConNum;
        }
        
        logClients('remove after:', Clients);
        
        log(conNum, 'console disconnected');
        
        socket.removeListener('command', onMessage);
        socket.removeListener('disconnect', onDisconnect);
    }.bind(null, ConNum);
    
    socket.on('command', onMessage);
    socket.on('disconnect', onDisconnect);
}

function processing(socket, conNum, fn, command) {
    log(conNum, command.cmd);
    
    fn(socket, command, cwd(conNum));
}

function cwd(conNum) {
    return (path) => {
        if (!path)
            return Clients[conNum].cwd;
        
        Clients[conNum].cwd = path;
    };
}

function getType(type) {
    if (!type)
        return ' ';
    
    return ` ${type}:`;
}

function log(connNum, str, typeParam) {
    if (!str)
        return;
    
    const type = getType(typeParam);
    const ret = 'client #' + connNum + type + str;
    
    logConsole(ret);
    
    return ret;
}

