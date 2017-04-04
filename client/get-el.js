'use strict';

module.exports = (el) => {
    if (typeof el === 'string')
        return document.querySelector(el);
    
    return el;
}

