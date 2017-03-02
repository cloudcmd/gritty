#!/usr/bin/env node

'use strict';

const argv = process.argv;
const argvLast = argv.slice().pop();

switch (argvLast) {
case '-v':
    version();
    break;

case '--v':
    version();
    break;

default:
    start_();
}

function start_() {
    const path = require('path');
    const http = require('http');
    const server = http.createServer();
    
    const express = require('express');
    const gritty = require('..');
    const app = express(server);
    
    require('express-ws')(app);
    
    const pty = require('node-pty');
    
    const terminals = {};
    const logs = {};
    
    const dir = path.resolve(__dirname + '/..');
    
    app.use(gritty({server}))
    app.use(express.static(dir));
    
    app.get('/', (req, res) => {
        res.sendFile(`${dir}/index.html`);
    });
    
    app.post('/terminals', (req, res) => {
        const cols = parseInt(req.query.cols);
        const rows = parseInt(req.query.rows);
        const cmd = process.platform === 'win32' ? 'cmd.exe' : 'bash';
        
        const term = pty.spawn(cmd, [], {
            name: 'xterm-color',
            cols: cols || 80,
            rows: rows || 24,
            cwd: process.env.PWD,
            env: process.env
        });
      
        console.log('Created terminal with PID: ' + term.pid);
        terminals[term.pid] = term;
        logs[term.pid] = '';
      
        term.on('data', (data) => {
            logs[term.pid] += data;
        });
      
        res.send(term.pid.toString());
        res.end();
    });

    app.post('/terminals/:pid/size', (req, res) => {
        const pid = parseInt(req.params.pid);
        const cols = parseInt(req.query.cols);
        const rows = parseInt(req.query.rows);
        const term = terminals[pid];
         
        term.resize(cols, rows);
        console.log('Resized terminal ' + pid + ' to ' + cols + ' cols and ' + rows + ' rows.');
        res.end();
    });

    app.ws('/terminals/:pid', (ws, req) => {
        const term = terminals[parseInt(req.params.pid)];
        console.log('Connected to terminal ' + term.pid);
        ws.send(logs[term.pid]);

        term.on('data', (data) => {
            try {
                ws.send(data);
            } catch (ex) {
          // The WebSocket is not open, ignore
            }
        });
        ws.on('message', (msg) => {
            term.write(msg);
        });
        ws.on('close', function () {
            process.kill(term.pid);
            console.log('Closed terminal ' + term.pid);
        // Clean things up
            delete terminals[term.pid];
            delete logs[term.pid];
        });
    });

    const port = process.env.PORT || 1337;

    console.log(`App listening to http://localhost:${port}`);
    app.listen(port);
}

function start() {
    const DIR = __dirname + '/../';
    
    const gritty  = require('../');
    const http = require('http');
    
    const express = require('express');
     
    const app = express();
    const server = http.createServer(app);
    
    const port =    process.env.PORT            ||  /* c9           */
                    process.env.app_port        ||  /* nodester     */
                    process.env.VCAP_APP_PORT   ||  /* cloudfoundry */
                    1337;
    
    const ip = process.env.IP ||  /* c9 */
              '0.0.0.0';
    
    app.use(gritty({server}))
        .use(express.static(DIR));
    
    gritty.listen({
        server
    });
    
    server.listen(port, ip);
    
    console.log('url: http://' + ip + ':' + port);
}

function version() {
    const pack = require('../package');
    console.log('v' + pack.version);
}

