'use strict';

require('xterm/css/xterm.css');

const {FitAddon} = require('xterm-addon-fit');
const {WebglAddon} = require('xterm-addon-webgl');
const currify = require('currify');
const tryCatch = require('try-catch');

const getEl = require('./get-el');
const getHost = require('./get-host');
const getEnv = require('./get-env');
const wrap = require('wraptile');

const {io} = require('socket.io-client');
const {Terminal} = require('xterm');
const onWindowResize = wrap(_onWindowResize);
const onTermData = currify(_onTermData);
const onTermResize = currify(_onTermResize);
const onData = currify(_onData);

const onDisconnect = wrap(_onDisconnect);

const onConnect = wrap(_onConnect);

module.exports = gritty;
module.exports._onConnect = _onConnect;
module.exports._onDisconnect = _onDisconnect;
module.exports._onData = _onData;
module.exports._onTermResize = _onTermResize;
module.exports._onTermData = _onTermData;
module.exports._onWindowResize = _onWindowResize;

const defaultFontFamily = 'Menlo, Consolas, "Liberation Mono", Monaco, "Lucida Console", monospace';

module.exports._defaultFontFamily = defaultFontFamily;

function gritty(element, options = {}) {
    const el = getEl(element);
    
    const {
        socketPath = '',
        fontFamily = defaultFontFamily,
        prefix = '/gritty',
        command,
        autoRestart,
        cwd,
    } = options;
    
    const env = getEnv(options.env || {});
    const socket = connect(prefix, socketPath);
    
    return createTerminal(el, {
        env,
        cwd,
        command,
        autoRestart,
        socket,
        fontFamily,
    });
}

function createTerminal(terminalContainer, {env, cwd, command, autoRestart, socket, fontFamily}) {
    const fitAddon = new FitAddon();
    const webglAddon = new WebglAddon();
    const terminal = new Terminal({
        scrollback: 1000,
        tabStopWidth: 4,
        fontFamily,
        allowProposedApi: true,
    });
    
    terminal.open(terminalContainer);
    terminal.focus();
    
    terminal.loadAddon(webglAddon);
    terminal.loadAddon(fitAddon);
    fitAddon.fit();
    
    terminal.onResize(onTermResize(socket));
    terminal.onData(onTermData(socket));
    
    window.addEventListener('resize', onWindowResize(fitAddon));
    
    const {cols, rows} = terminal;
    
    socket.on('accept', onConnect(socket, fitAddon, {
        env,
        cwd,
        cols,
        rows,
        command,
        autoRestart,
    }));
    socket.on('disconnect', onDisconnect(terminal));
    socket.on('data', onData(terminal));
    
    return {
        socket,
        terminal,
    };
}

function _onConnect(socket, fitAddon, {env, cwd, cols, rows, command, autoRestart}) {
    socket.emit('terminal', {
        env,
        cwd,
        cols,
        rows,
        command,
        autoRestart,
    });
    socket.emit('resize', {
        cols,
        rows,
    });
    fitAddon.fit();
}

function _onDisconnect(terminal) {
    terminal.writeln('terminal disconnected...');
}

function _onData(terminal, data) {
    terminal.write(data);
}

function _onTermResize(socket, {cols, rows}) {
    socket.emit('resize', {
        cols,
        rows,
    });
}

function _onTermData(socket, data) {
    socket.emit('data', data);
}

function _onWindowResize(fitAddon) {
    // Uncaught Error: This API only accepts integers
    // when gritty mimized
    const fit = fitAddon.fit.bind(fitAddon);
    tryCatch(fit);
}

function connect(prefix, socketPath) {
    const href = getHost();
    const FIVE_SECONDS = 5000;
    
    const path = `${socketPath}/socket.io`;
    const socket = io.connect(href + prefix, {
        'max reconnection attempts': 2 ** 32,
        'reconnection limit': FIVE_SECONDS,
        path,
    });
    
    return socket;
}
