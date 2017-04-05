'use strict';

const test = require('tape');
const sinon = require('../sinon');

const wrap = require('../../client/wrap');

test('gritty: wrap', (t) => {
    const fn = sinon.stub();
    const f1 = wrap(fn);
    
    const f2 = f1('hello');
    
    f2();
    
    t.ok(fn.calledWith('hello'), 'should call fn with args');
    t.end();
});

