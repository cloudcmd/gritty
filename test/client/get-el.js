'use strict';

const test = require('tape');
const diff = require('sinon-called-with-diff');
const sinon = diff(require('sinon'));

const getEl = require('../../client/get-el');

test('gritty: get-el: object', (t) => {
    const el = {};
    
    t.equal(getEl(el), el, 'should return el');
    t.end();
});

test('gritty: get-el: string', (t) => {
    const el = 'hello'
    const querySelector = sinon.stub();
    
    global.document = {querySelector};
    
    getEl(el);
    
    t.ok(querySelector.calledWith(el), 'should call querySelector');
    
    delete global.document;
    
    t.end();
});

