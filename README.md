hapi-websocket
===============

Hapi plugin integration by injecting WebSocket/Socket.io messages as HTTP request

### Get Started

```
npm i hapi-websocket --save
```

```js

server.register([
        { plugin: require("hapi-websocket"), 
        options:{
            //label: 'socket',/* (optional) Select Connections by Label */
             //namespaces: ['/', '/client','/admin'], /* (optional) - an array of strings representing namespaces. Namespaces must always begin with a slash '/' (e.g. '/mynamespace'. The default '/' namespace is always available irrespective if explicitly specified, and will be the only namespace available to routes if this option is not set upon plugin initialization. */
             //socket:  /*(optional) an object which is passed through to socket.io*/
        }},
       
    ]);

```

```js

var Hapi = require("hapi");

const server = Hapi.server({
    port: 8080,
    host: 'localhost'
});

(async () => {

    await server.register([
        { plugin: require("../dist") },
        { plugin: require("inert") },
    ]);

    server.route([
        {
            method: 'POST',
            path: '/hello',
            config: {
                plugins: {
                    websocket: {
                        event: 'ping-pong',
                    }
                }
            },
            handler: async (request, h) => {
                console.log(request.payload);
                var ws = request.websocket;                

                return new Promise((resolve, reject) => {
                    resolve({ mode: ws.mode, reply: 'pong' });
                });
                // h.response(request.payload);
            }
        },


        {
            method: "GET",
            path: "/{p*}",

            handler: (request, h) => {
                return h.file("./src/www/index.html");
            }
        }
    ]);

    await server.start();

    console.log("Worker %s started and running at: %s", process.pid, server.info.uri);

})();

```

```html
<!DOCTYPE html>

<html lang="en">

<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <title>Hapi websocket plugin</title>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/socket.io/2.1.1/socket.io.js"></script>

</head>

<body>
    <div id="app">

        <script>
            $(function () {
                var socket = io();

                console.log('socket start...');

                socket.emit('ping-pong', { cmd: 'hello' }, function (res) {
                    // res is the result from the hapi route
                    console.log(res);
                });
            })

        </script>
    </div>
</body>

</html>
```


### MIT License

Copyright (c) 2018 Nasa8x

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.