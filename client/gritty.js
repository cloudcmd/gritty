import '@xterm/xterm/css/xterm.css';
import {FitAddon} from '@xterm/addon-fit';
import {WebglAddon as _WebglAddon} from '@xterm/addon-webgl';
import currify from 'currify';
import {tryCatch} from 'try-catch';
import wrap from 'wraptile';
import {io} from 'socket.io-client';
import * as TerminalDefault from '@xterm/xterm';
import getEl from './get-el.js';
import getHost from './get-host.js';
import getEnv from './get-env.js';

const onWindowResize = wrap(_onWindowResize);
const onTermData = currify(_onTermData);
const onTermResize = currify(_onTermResize);
const onData = currify(_onData);

const onDisconnect = wrap(_onDisconnect);

const onConnect = wrap(_onConnect);

export default gritty;

const defaultFontFamily = 'Menlo, Consolas, "Liberation Mono", Monaco, "Lucida Console", monospace';

export const _defaultFontFamily = defaultFontFamily;

function gritty(element, options = {}) {
    const el = getEl(element);
    
    const {
        socketPath = '',
        fontFamily = defaultFontFamily,
        prefix = '/gritty',
        command,
        autoRestart,
        cwd,
        connect,
        Terminal = TerminalDefault.Terminal,
        WebglAddon = _WebglAddon,
    } = options;
    
    const env = getEnv(options.env || {});
    
    const socket = doConnect(prefix, socketPath, {
        connect,
    });
    
    return createTerminal(el, {
        env,
        cwd,
        command,
        autoRestart,
        socket,
        fontFamily,
        Terminal,
        WebglAddon,
    });
}

function createTerminal(terminalContainer, overrides) {
    const {
        env,
        cwd,
        command,
        autoRestart,
        socket,
        fontFamily,
        Terminal,
        WebglAddon,
    } = overrides;
    
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
    
    globalThis.addEventListener('resize', onWindowResize(fitAddon));
    
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

export function _onConnect(socket, fitAddon, {env, cwd, cols, rows, command, autoRestart}) {
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

export function _onDisconnect(terminal) {
    terminal.writeln('terminal disconnected...');
}

export function _onData(terminal, data) {
    terminal.write(data);
}

export function _onTermResize(socket, {cols, rows}) {
    socket.emit('resize', {
        cols,
        rows,
    });
}

export function _onTermData(socket, data) {
    socket.emit('data', data);
}

export function _onWindowResize(fitAddon) {
    // Uncaught Error: This API only accepts integers
    // when gritty mimized
    const fit = fitAddon.fit.bind(fitAddon);
    tryCatch(fit);
}

function doConnect(prefix, socketPath, overrides = {}) {
    const {connect = io.connect} = overrides;
    const href = getHost();
    const FIVE_SECONDS = 5000;
    
    const path = `${socketPath}/socket.io`;
    const socket = connect(href + prefix, {
        'max reconnection attempts': 2 ** 32,
        'reconnection limit': FIVE_SECONDS,
        path,
    });
    
    return socket;
}
