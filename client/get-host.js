export default () => {
    const l = location;
    
    return l.origin || l.protocol + '//' + l.host;
};
