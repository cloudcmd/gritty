#!/usr/bin/env node

'use strict';

/**
 * @typedef {{
 *     "auto-restart": true,
 *     "port": 8081,
 *     "command": "bash"
 * }} Config
 */

const fs = require('fs');

const args = require('yargs-parser')(process.argv.slice(2), {
    boolean: [
        'version',
        'help',
        'auto-restart',
        'path',
    ],
    number: [
        'port',
    ],
    string: [
        'command',
        'config-path'
    ],
    alias: {
        help: 'h',
        version: 'v',
    },
    default: {
        'port': process.env.PORT | 1337,
        'auto-restart': true,
    },
});

const getMessage = (a) => a.message;

main(args);

function main(args) {
    if (args.help)
        return help();
    
    if (args.version)
        return version();
    
    if (args.path)
        return path();
    

    if (args.configPath) {
        /**
         * @type {Config}
         */
        let config = null;

        try {
            config = loadConfigFile(args.configPath);
        } catch (e) {
            console.log(e);
            console.log('exit');
            return;
        }

        start({
            port: config.port,
            command: config.command,
            autoRestart: config.autoRestart,
        });
    } else {
        start({
            port: args.port,
            command: args.command,
            autoRestart: args.autoRestart,
        });
    }
}

function path() {
    const {join} = require('path');
    console.log(join(__dirname, '..'));
}

function start(options) {
    const squad = require('squad');
    
    const {
        port,
        command,
        autoRestart,
    } = options;
    
    check(port);
    
    const DIR = __dirname + '/../';
    
    const gritty = require('../');
    const http = require('http');
    
    const express = require('express');
    const io = require('socket.io');
    
    const app = express();
    const server = http.createServer(app);
    
    const ip = process.env.IP || /* c9 */
              '0.0.0.0';
    
    app.use(gritty())
        .use(express.static(DIR));
    
    const socket = io(server);
    
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
    
    for (const name of Object.keys(bin)) {
        console.log('  %s %s', name, bin[name]);
    }
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

/**
 * @param path {string} config path
 * @returns {}
 */
function loadConfigFile(path) {
    /**
     * @type {Config}
     */
    let config = null;

    try {
        let fileContent = fs.readFileSync(path, {
            encoding: 'utf-8',
            flag: 'r'
        });

        config = JSON.parse(fileContent);
    } catch (e) {
        console.log(e);
        throw new Error('Cannot parse config file.');
    }

    return config;
}

