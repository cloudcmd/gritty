'use strict';

const {
    run,
    series,
    parallel,
} = require('madrun');

module.exports = {
    'test': () => `tape 'test/**/*.js'`,
    'watch:test': () => `nodemon -w lib -w test -x ${run('test')}`,
    "lint:test": () => "eslint -c .eslintrc.server test",
    "lint:server": () => "eslint -c .eslintrc.server --rule 'no-console:0' bin server",
    "lint:client": () => "eslint --env browser --config .eslintrc client",
    'lint': () => series(['putout', 'lint:*']),
    'fix:lint': () => series(['putout', 'lint:*'], '--fix'),
    'putout': () => `putout bin test client server`,
    'coverage': () => `nyc ${run('test')}`,
    'report': () => `nyc report --reporter=text-lcov | coveralls || true`,
};

