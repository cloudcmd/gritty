'use strict';

module.exports = (env) => {
    const obj = {};
    
    Object.keys(env).forEach((name) => {
        obj[name] = getValue(env[name]);
    });
    
    return obj;
}

function getValue(value) {
    if (typeof value === 'function')
        return value();
    
    return value;
}

