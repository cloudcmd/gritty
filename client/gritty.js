'use strict';

require('xterm/dist/xterm.css');

const fit = require('xterm/lib/addons/fit/fit');
const currify = require('currify/legacy');

const getEl = require('./get-el');
const getHost = require('./get-host');
const getEnv = require('./get-env');
const wrap = require('wraptile/legacy');

const onConnect = wrap(_onConnect);
const onDisconnect = wrap(_onDisconnect);
const onData = currify(_onData);
const onTermResize = currify(_onTermResize);
const onTermData = currify(_onTermData);
const onWindowResize = wrap(_onWindowResize);

const io = require('socket.io-client/dist/socket.io');

const {Terminal} = require('xterm');

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
    
    const socketPath = options.socketPath || '';
    const fontFamily = options.fontFamily || defaultFontFamily;
    const prefix = options.prefix || '/gritty';
    const env = getEnv(options.env || {});
    
    const socket = connect(prefix, socketPath);
    
    Terminal.applyAddon(fit);
    
    return createTerminal(el, {
        env,
        socket,
        fontFamily
    });
}

function createTerminal(terminalContainer, {env, socket, fontFamily}) {
    const terminal = new Terminal({
        scrollback: 1000,
        tabStopWidth: 4,
        experimentalCharAtlas: 'dynamic',
        fontFamily,
    });
    
    terminal.open(terminalContainer);
    terminal.focus();
    terminal.fit();
    
    terminal.on('resize', onTermResize(socket));
    terminal.on('data', onTermData(socket));
    
    window.addEventListener('resize', onWindowResize(terminal))
    
    const {cols, rows} = terminal.proposeGeometry()
    
    // auth check delay
    socket.on('accept', onConnect(socket, terminal, {env, cols, rows}));
    socket.on('disconnect', onDisconnect(terminal));
    socket.on('data', onData(terminal));
    
    return {
        socket,
        terminal
    };
}

function _onConnect(socket, terminal, {env, cols, rows}) {
    socket.emit('terminal', {env, cols, rows});
    socket.emit('resize', {cols, rows});
    terminal.fit();
}

function _onDisconnect(terminal) {
    terminal.writeln('terminal disconnected...');
}

function _onData(terminal, data) {
    terminal.write(data);
}

function _onTermResize(socket, {cols, rows}) {
    socket.emit('resize', {cols, rows});
}

function _onTermData(socket, data) {
    socket.emit('data', data);
}

function _onWindowResize(terminal) {
    terminal.fit();
}

function connect(prefix, socketPath) {
    const href = getHost();
    const FIVE_SECONDS = 5000;
    
    const path = socketPath + '/socket.io';
    const socket = io.connect(href + prefix, {
        'max reconnection attempts' : Math.pow(2, 32),
        'reconnection limit'        : FIVE_SECONDS,
        path
    });
    
    return socket;
}

