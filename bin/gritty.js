#!/usr/bin/env node

import process from 'node:process';
import http from 'node:http';
import {fileURLToPath} from 'node:url';
import {dirname} from 'node:path';
import yargsParser from 'yargs-parser';
import squad from 'squad';
import express from 'express';
import {Server} from 'socket.io';
import {gritty} from '#gritty/server';
import bin from '../help.json' with {
    type: 'json',
};
import pack from '../package.json' with {
    type: 'json',
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const args = yargsParser(process.argv.slice(2), {
    boolean: [
        'version',
        'help',
        'auto-restart',
        'path',
    ],
    number: ['port'],
    string: ['command'],
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
    
    start({
        port: args.port,
        command: args.command,
        autoRestart: args.autoRestart,
    });
}

function path() {
    console.log(new URL('..', import.meta.url).pathname);
}

function start(options) {
    const {
        port,
        command,
        autoRestart,
    } = options;
    
    check(port);
    
    const DIR = `${__dirname}/../`;
    
    const app = express();
    const server = http.createServer(app);
    
    const c9 = process.env.IP;
    const ip = c9 || '0.0.0.0';
    
    app
        .use(gritty())
        .use(express.static(DIR));
    
    const socket = new Server(server);
    
    gritty.listen(socket, {
        command,
        autoRestart,
    });
    
    server
        .listen(port, ip)
        .on('error', squad(exit, getMessage));
    
    console.log(`url: http://localhost:${port}`);
}

function help() {
    const usage = 'Usage: gritty [options]';
    
    console.log(usage);
    console.log('Options:');
    
    for (const name of Object.keys(bin)) {
        console.log('  %s %s', name, bin[name]);
    }
}

function version() {
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
