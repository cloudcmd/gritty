'use strict';

const test = require('tape');
const diff = require('sinon-called-with-diff');
const sinon = diff(require('sinon'));

const getEnv = require('../../client/get-env');

test('gritty: get-env: empty', (t) => {
    const env = {};
    
    t.deepEqual(getEnv(env), {}, 'should return env');
    t.end();
});

test('gritty: get-env: value', (t) => {
    const env = {
        hello: 123
    };
    
    t.deepEqual(getEnv(env), env, 'should return env');
    t.end();
});

test('gritty: get-env: function', (t) => {
    const env = {
        hello: () => 1337
    };
    
    const expected = {
        hello: 1337
    };
    
    t.deepEqual(getEnv(env), expected, 'should return env');
    t.end();
});

