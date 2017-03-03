Gritty [![License][LicenseIMGURL]][LicenseURL] [![NPM version][NPMIMGURL]][NPMURL] [![Dependency Status][DependencyStatusIMGURL]][DependencyStatusURL] [![Build Status][BuildStatusIMGURL]][BuildStatusURL]
=======
[NPMIMGURL]:                https://img.shields.io/npm/v/gritty.svg?style=flat
[BuildStatusIMGURL]:        https://img.shields.io/travis/cloudcmd/gritty/master.svg?style=flat
[DependencyStatusIMGURL]:   https://img.shields.io/gemnasium/cloudcmd/gritty.svg?style=flat
[LicenseIMGURL]:            https://img.shields.io/badge/license-MIT-317BF9.svg?style=flat
[NPM_INFO_IMG]:             https://nodei.co/npm/cloudcmd.png
[NPMURL]:                   https://npmjs.org/package/cloudcmd "npm"
[BuildStatusURL]:           https://travis-ci.org/cloudcmd/gritty  "Build Status"
[DependencyStatusURL]:      https://gemnasium.com/cloudcmd/gritty "Dependency Status"
[LicenseURL]:               https://tldrlegal.com/license/mit-license "MIT License"

Web terminal emulator.

## Install

`npm i gritty -g`

### On Windows

When could not install on windows try to install `windows-build-tools` first:

```sh
npm i windows-build-tools -g
npm i gritty -g
```

## Use as standalone

Start `gritty`, and go to url `http://localhost:1337`

![Gritty on windows](https://raw.githubusercontent.com/cloudcmd/gritty/master/img/gritty.png "Gritty")

## API

### Client API

#### gritty(element [, options])

```js
const prefix = '/gritty'; // default
cosnt env = {}; // default

gritty('body', {
    prefix,
    env,
});
```

### Server API

#### gritty.listen(socket, options)

`Gritty` could be used as middleware:

```js
const prefix = '/gritty'; // default
const authCheck = (socket, success) => {}; // optional

gritty.listen(socket, {
    prefix,
    authCheck,
})
```

#### gritty(options)

Middleware function:

```js
const prefix = '/gritty'; // default

gritty({prefix});
```

## Usage as middleware

To use `gritty` in your programs you should make local install:

`npm i gritty socket.io express --save`

And use it this way:

```js
// server.js

const gritty = require('gritty');
const http = require('http');
const express = require('express');
const io = require('socket.io');

const app = express();
const server = http.createServer(app);
const socket = io.listen(server);

const port = 1337;
const ip = '0.0.0.0';

app.use(gritty())
app.use(express.static(__dirname));

gritty.listen(socket);
server.listen(port, ip);
```

```html
<!-- index.html -->

<div class="gritty"></div>
<script src="/gritty/gritty.js"></script>
<script>
    const options = {
        prefix: 'console',
        env: {
            TERMINAL: 'gritty',
            CURREN: getCurrentFile,
        }
    };
    
    gritty('.console', options);
    
    function getCurrentFile() {
        return 'filename.txt';
    }
</script>
```

## Environments

In old `node.js` environments that not fully supports `es2015`, `gritty` could be used with:

```js
var gritty = require('gritty/legacy');
```

## License

MIT

