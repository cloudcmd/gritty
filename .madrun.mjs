import {run, cutEnv} from 'madrun';

const SUPERTAPE_TIMEOUT = 15_000;

export default {
    'start': () => 'node bin/gritty',
    'start:dev': () => 'NODE_ENV=development npm start',
    'lint': () => 'putout .',
    'fresh:lint': () => run('lint', '--fresh'),
    'lint:fresh': () => run('lint', '--fresh'),
    'fix:lint': () => run('lint', '--fix'),
    'watch:test': () => run('watcher', 'npm test'),
    'watcher': () => 'nodemon -w test -w client -w server --exec',
    'build-progress': () => 'webpack --progress',
    '6to5:client': () => run('build-progress', '--mode production'),
    '6to5:client:dev': async () => `NODE_ENV=development ${await run('build-progress', '--mode development')}`,
    'watch:client': () => run('6to5:client', '--watch'),
    'watch:client:dev': () => run('6to5:client:dev', '--watch'),
    'wisdom': () => run('build'),
    'build': () => run('6to5:*'),
    'build:start': () => run(['build:client', 'start']),
    'build:start:dev': () => run(['build:client:dev', 'start:dev']),
    'build:client': () => run('6to5:client'),
    'build:client:dev': () => run('6to5:client:dev'),
    'watch:lint': async () => `nodemon -w client -w server -w webpack.config.js -x ${await run('lint')}`,
    'report': () => 'c8 report --reporter=lcov',
    
    'coverage': async () => [`c8 ${await cutEnv('test')}`, {
        SUPERTAPE_TIMEOUT,
    }],
    
    'test': () => [`tape 'test/**/*.js'`, {
        SUPERTAPE_TIMEOUT,
    }],
};
