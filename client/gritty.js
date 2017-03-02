'use strict';

require('xterm/dist/xterm.css');

require('xterm/dist/addons/fit');
require('xterm/dist/addons/attach');

window.Promise = window.Promise || require('promise-polyfill');
window.fetch = window.fetch || require('whatwg-fetch');

const Terminal = require('xterm/dist/xterm');

const getEl = (el) => {
    if (typeof el === 'string')
        return document.querySelector(el);
    
    return el;
}

module.exports = (element) => {
    const el = getEl(element);
    createTerminal(el);
}

function createTerminal(terminalContainer) {
    let Pid;
    
    const term = new Terminal({
        cursorBlink: true,
        scrollback: 1000,
        tabStopWidth: 4,
        theme: 'gritty',
    });
    
    term.on('resize', (size) => {
        if (!Pid)
            return;
         
        const {cols, rows}  = size;
        const url = '/terminals/' + Pid + '/size?cols=' + cols + '&rows=' + rows;
        
        fetch(url, {method: 'POST'});
    });
    
    window.addEventListener('resize', () => {
        term.fit();
    });
  
    const protocol = (location.protocol === 'https:') ? 'wss://' : 'ws://';
    let socketURL = protocol + location.hostname + ((location.port) ? (':' + location.port) : '') + '/terminals/';
    term.open(terminalContainer);
    term.fit();
    
    const initialGeometry = term.proposeGeometry();
    const {cols, rows} = initialGeometry;
    
    fetch('/terminals?cols=' + cols + '&rows=' + rows, {method: 'POST'}).then((res) => {
        res.text().then((pid) => {
            Pid = pid;
            socketURL += pid;
            const socket = new WebSocket(socketURL);
            
            socket.onopen = () => {
                term.attach(socket);
                term._initialized = true;
            };
        });
    });
}

