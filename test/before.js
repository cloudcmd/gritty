import http from 'node:http';
import {promisify} from 'node:util';
import express from 'express';
import {Server} from 'socket.io';
import {gritty} from '#gritty/server';

const isFn = (a) => typeof a === 'function';

export default before;

function before(options, fn = options) {
    if (isFn(options))
        options = {};
    
    const app = express();
    const server = http.createServer(app);
    
    const after = () => {
        server.close();
    };
    
    app.use(gritty());
    
    const socket = new Server(server);
    
    gritty.listen(socket, options);
    
    server.listen(() => {
        const {port} = server.address();
        fn(port, after, socket);
    });
}

export const connect = promisify((options, fn = options) => {
    before(options, (port, done, socket) => {
        fn(null, {
            port,
            done,
            socket,
        });
    });
});
