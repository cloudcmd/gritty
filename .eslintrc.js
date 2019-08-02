'use strict';

module.exports = {
    extends: [
        'plugin:putout/recommended',
    ],
    plugins: [
        'putout',
        'node',
    ],
    overrides: [{
        files: ['bin/**/*.js'],
        rules: {
            'no-console': 0,
            'no-process-exit': 0,
        },
        extends: [
            'plugin:node/recommended',
        ],
    }, {
        files: ['client/**/*.js'],
        env: {
            browser: true,
        },
    }],
};
