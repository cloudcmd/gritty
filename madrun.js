'use strict';

const {run} = require('madrun');

module.exports = {
    'test': () => `tape 'test/**/*.js'`,
    'watch:test': () => `nodemon -w lib -w test -x ${run('test')}`,
    'lint:test': () => 'eslint -c .eslintrc.server test madrun.js',
    'fix:lint': () => run('lint', '--fix'),
    'lint': () => `putout bin test client server madrun.js`,
    'coverage': () => `nyc ${run('test')}`,
    'report': () => `nyc report --reporter=text-lcov | coveralls || true`,
};

