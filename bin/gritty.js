#!/usr/bin/env node

'use strict';

const args = require('yargs-parser')(process.argv.slice(2), {
    boolean: [
        'version',
        'help',
        'auto-restart',
    ],
    number: [
        'port',
    ],
    string: [
        'command',
        'path',
    ],
    alias: {
        'help': 'h',
        'version': 'v',
    },
    default: {
        'port': process.env.PORT | 1337,
        'auto-restart': true,
    }
});

const getMessage = (a) => a.message;

main(args);

function main() {
    if (args.help)
        return help();
    
    if (args.version)
        return version();
    
    if (args.path)
        return path();
    
    start({
        port: args.port,
        command: args.command,
        autoRestart: args.autoRestart,
    });
}

function path() {
    const join = require('path').join
    console.log(join(__dirname, '..'));
}

function start(options) {
    const squad = require('squad');
    
    let {
        port,
        command,
        autoRestart,
    } = options;
    
    check(port);
    
    const DIR = __dirname + '/../';
    
    const gritty  = require('../');
    const http = require('http');
    
    const express = require('express');
    const io = require('socket.io');
     
    const app = express();
    const server = http.createServer(app);
    
    const ip = process.env.IP ||  /* c9 */
              '0.0.0.0';
    
    app.use(gritty())
        .use(express.static(DIR));
    
    const socket = io.listen(server);
    
    gritty.listen(socket, {
        command,
        autoRestart,
    });
    
    server.listen(port, ip)
        .on('error', squad(exit, getMessage));
    
    console.log(`url: http://localhost:${port}`);
}

function help() {
    const bin = require('../help');
    const usage = 'Usage: gritty [options]';
    
    console.log(usage);
    console.log('Options:');
    
    Object.keys(bin).forEach((name) => {
        console.log('  %s %s', name, bin[name]);
    });
}

function version() {
    const pack = require('../package');
    console.log('v' + pack.version);
}

function check(port) {
    if (isNaN(port))
        exit('port should be a number 0..65535');
}

function exit(msg) {
    console.error(msg);
    process.exit(-1);
}

