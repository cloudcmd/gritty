'use strict';

module.exports = (fn) => (...args) => () => fn(...args);

