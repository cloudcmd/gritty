'use strict';

const {run} = require('madrun');

module.exports = {
    'test': () => `tape 'test/**/*.js'`,
    'watch:test': () => `nodemon -w lib -w test -x ${run('test')}`,
    'lint:test': () => 'eslint -c .eslintrc.server test madrun.js',
    'lint:server': () => 'eslint -c .eslintrc.server --rule \'no-console:0\' bin server',
    'lint:client': () => 'eslint --env browser --config .eslintrc client',
    'lint': () => run(['putout', 'lint:*']),
    'fix:lint': () => run(['putout', 'lint:*'], '--fix'),
    'putout': () => `putout bin test client server madrun.js`,
    'coverage': () => `nyc ${run('test')}`,
    'report': () => `nyc report --reporter=text-lcov | coveralls || true`,
};

