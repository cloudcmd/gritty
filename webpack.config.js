import path, {dirname} from 'node:path';
import {env} from 'node:process';
import {fileURLToPath} from 'node:url';
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dir = './client';
const isDev = env.NODE_ENV === 'development';

const dist = path.resolve(__dirname, 'dist');
const distDev = path.resolve(__dirname, 'dist-dev');
const devtool = isDev ? 'eval' : 'source-map';
const notEmpty = (a) => a;
const clean = (array) => array.filter(notEmpty);

const rules = clean([
    !isDev && {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
    },{
        test: /\.css$/,
        use: [
            'style-loader',
            'css-loader',
            'clean-css-loader',
        ],
    }]);

export default {
    devtool,
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
    optimization: {
        minimize: true,
        minimizer: [
            new CssMinimizerPlugin(),
        ],
    },
};

function devtoolModuleFilenameTemplate(info) {
    const resource = info.absoluteResourcePath.replace(__dirname + path.sep, '');
    return `file://gritty/${resource}`;
}
