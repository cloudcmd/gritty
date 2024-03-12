'use strict';

const isString = (a) => typeof a === 'string';

module.exports = (el) => {
    if (isString(el))
        return document.querySelector(el);
    
    return el;
};
