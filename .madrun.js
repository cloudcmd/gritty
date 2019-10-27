'use strict';

const {
    run,
    series,
    parallel,
} = require('madrun');

module.exports = {
    "start": () => 'node bin/gritty',
    "start:dev": () => 'NODE_ENV=development npm start',
    "lint": () => 'putout bin test client server',
    "watch:test": () => run('watcher', 'npm test'),
    "watcher": () => 'nodemon -w test -w client -w server --exec',
    "build-progress": () => 'webpack --progress',
    "6to5:client": () => run('build-progress', '--mode production'),
    "6to5:client:dev": () => `NODE_ENV=development ${run('build-progress', '--mode development')}`,
    "watch:client": () => run('6to5:client', '--watch'),
    "watch:client:dev": () => run('6to5:client:dev', '--watch'),
    "wisdom": () => run('build'),
    "build": () => run('6to5:*'),
    "build:start": () => run(['build:client', 'start']),
    "build:start:dev": () => run(['build:client:dev', 'start:dev']),
    "build:client": () => run('6to5:client'),
    "build:client:dev": () => run('6to5:client:dev'),
    "watch:lint": () => 'nodemon -w client -w server -w webpack.config.js -x \'redrun lint\'',
    "watch:lint:client": () => 'nodemon -w client -w webpack.config.js -x \'redrun lint:putout:client\'',
    'report': () => 'nyc report --reporter=text-lcov | coveralls',
    'coverage': () => 'nyc npm test',
    'test': () => `tape 'test/**/*.js'`,
};

