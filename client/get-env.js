'use strict';

const isFn = (a) => typeof a === 'function';

module.exports = (env) => {
    const obj = {};
    
    for (const name of Object.keys(env)) {
        obj[name] = getValue(env[name]);
    }
    
    return obj;
};

function getValue(value) {
    if (isFn(value))
        return value();
    
    return value;
}
