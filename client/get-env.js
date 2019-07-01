'use strict';

module.exports = (env) => {
    const obj = {};
    
    for (const name of Object.keys(env)) {
        obj[name] = getValue(env[name]);
    }
    
    return obj;
};

function getValue(value) {
    if (typeof value === 'function')
        return value();
    
    return value;
}

