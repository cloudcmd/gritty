'use strict';

const test = require('tape');
const diff = require('sinon-called-with-diff');
const sinon = diff(require('sinon'));

const cursorBlink = require('../../client/cursor-blink');

test('gritty: cursor-blink: setOption: true', (t) => {
    const setOption = sinon.stub();
    
    cursorBlink({setOption}, true);
    
    t.ok(setOption.calledWith('cursorBlink', true), 'should call setOption with true');
    t.end();
});

test('gritty: cursor-blink: setOption: true', (t) => {
    const setOption = sinon.stub();
    
    cursorBlink({setOption}, false);
    
    t.ok(setOption.calledWith('cursorBlink', false), 'should call setOption with false');
    t.end();
});

