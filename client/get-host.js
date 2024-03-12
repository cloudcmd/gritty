'use strict';

module.exports = () => {
    const l = location;
    
    return l.origin || l.protocol + '//' + l.host;
};
