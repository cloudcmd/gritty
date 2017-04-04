'use strict';

const path = require('path');
const webpack = require('webpack');
const {optimize} = webpack;
const {UglifyJsPlugin} = optimize;

const dir = './client';

const {env} = process;
const isDev = env.NODE_ENV === 'development';

const dist = path.resolve(__dirname, 'dist');
const distDev = path.resolve(__dirname, 'dist-dev');
const devtool = isDev ? 'eval' : 'source-map';
const notEmpty = (a) => a;
const clean = (array) => array.filter(notEmpty);

const plugins = clean([
    !isDev && new UglifyJsPlugin({
        sourceMap: true,
        comments: false,
    })
]);
const loaders = clean([
    !isDev && {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
    }, {
        test: /\.css$/,
        loader: 'style-loader!css-loader!clean-css-loader'
    }
]);

module.exports = {
    devtool,
    entry: {
        gritty: `${dir}/gritty.js`,
    },
    output: {
        library: 'gritty',
        filename: '[name].js',
        path: isDev ? distDev : dist,
        libraryTarget: 'umd',
        devtoolModuleFilenameTemplate,
    },
    plugins,
    module: {
        loaders,
    },
    externals: [
        externals
    ],
};

function externals(context, request, fn) {
    if (!isDev)
        return fn();
    
    const list = [
        'promise-polyfill',
        'whatwg-fetch',
    ];
    
    if (list.includes(request))
        return fn(null, request);
    
    fn();
}

function devtoolModuleFilenameTemplate(info) {
    const resource = info.absoluteResourcePath.replace(__dirname + path.sep, '');
    return `file://gritty/${resource}`;
}

