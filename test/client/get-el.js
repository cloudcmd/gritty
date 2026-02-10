'use strict';

const {test, stub} = require('supertape');

const getEl = require('../../client/get-el');

test('gritty: get-el: object', (t) => {
    const el = {};
    
    t.equal(getEl(el), el, 'should return el');
    t.end();
});

test('gritty: get-el: string', (t) => {
    const el = 'hello';
    const querySelector = stub();
    
    globalThis.document = {
        querySelector,
    };
    
    getEl(el);
    
    t.calledWith(querySelector, [el], 'should call querySelector');
    
    delete globalThis.document;
    
    t.end();
});
