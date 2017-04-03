'use strict';

const currify = require('currify/legacy');

module.exports = currify((terminal, blink) => {
    terminal.setOption('cursorBlink', blink);
});

