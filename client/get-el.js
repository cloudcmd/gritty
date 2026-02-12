const isString = (a) => typeof a === 'string';

export default (el) => {
    if (isString(el))
        return document.querySelector(el);
    
    return el;
};
