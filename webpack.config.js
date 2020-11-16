'use strict';

const path = require('path');

const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const dir = './client';

const {env} = process;
const isDev = env.NODE_ENV === 'development';

const dist = path.resolve(__dirname, 'dist');
const distDev = path.resolve(__dirname, 'dist-dev');
const devtool = isDev ? 'eval' : 'source-map';
const notEmpty = (a) => a;
const clean = (array) => array.filter(notEmpty);

const plugins = clean([
    !isDev && new OptimizeCssAssetsPlugin({}),
]);

const rules = clean([
    !isDev && {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
    }, {
        test: /\.css$/,
        use: [
            'style-loader',
            'css-loader',
            'clean-css-loader',
        ],
    },
]);

module.exports = {
    devtool,
    plugins,
    entry: {
        gritty: `${dir}/gritty.js`,
    },
    output: {
        library: 'gritty',
        filename: '[name].js',
        path: isDev ? distDev : dist,
        pathinfo: isDev,
        devtoolModuleFilenameTemplate,
    },
    module: {
        rules,
    },
    performance: {
        maxEntrypointSize: 500_000,
        maxAssetSize: 500_000,
    },
};

function devtoolModuleFilenameTemplate(info) {
    const resource = info.absoluteResourcePath.replace(__dirname + path.sep, '');
    return `file://gritty/${resource}`;
}

