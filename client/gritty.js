'use strict';

require('xterm/dist/xterm.css');
require('../css/gritty.css');

require('xterm/dist/addons/fit');

const io = require('socket.io-client/dist/socket.io.min');
const timeout = (fn) => () => setTimeout(fn);

window.Promise = window.Promise || require('promise-polyfill');
window.fetch = window.fetch || require('whatwg-fetch');

const Terminal = require('xterm/dist/xterm');

const getEl = (el) => {
    if (typeof el === 'string')
        return document.querySelector(el);
    
    return el;
}

module.exports = (element, options = {}) => {
    const el = getEl(element);
    
    const socketPath = options.socketPath || '';
    const prefix = options.prefix || '/gritty';
    const env = getEnv(options.env || {});
    
    const socket = connect(prefix, socketPath);
    
    return createTerminal(el, {
        env,
        socket,
    });
}

function createTerminal(terminalContainer, {env, socket}) {
    const terminal = new Terminal({
        cursorBlink: true,
        scrollback: 1000,
        tabStopWidth: 4,
        theme: 'gritty',
    });
    
    terminal.open(terminalContainer);
    terminal.fit();
    
    terminal.on('resize', (size) => {
        const {cols, rows}  = size;
        
        socket.emit('resize', {cols, rows});
    });
    
    terminal.on('data', (data) => {
        socket.emit('data', data);
    });
    
    window.addEventListener('resize', () => {
        terminal.fit();
    });
  
    const {cols, rows} = terminal.proposeGeometry()
    
    // auth check delay
    socket.on('connect', timeout(() => {
        socket.emit('terminal', {env, cols, rows});
        socket.emit('resize', {cols, rows});
    }));
    
    socket.on('disconnect', () => {
        terminal.writeln('terminal disconnected...');
    });
    
    socket.on('data', (data) => {
        terminal.write(data);
    });
    
    return {
        socket,
        terminal
    };
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

function getValue(value) {
    if (typeof value === 'function')
        return value();
    
    return value;
}

function getEnv(env) {
    const obj = {};
    
    Object.keys(env).forEach((name) => {
        obj[name] = getValue(env[name]);
    });
    
    return obj;
}

function getHost() {
    const l = location;
    const href = l.origin || l.protocol + '//' + l.host;
    
    return href;
}

