var Hapi = require("hapi");

const server = Hapi.server({
    port: 8081,
    host: 'localhost'
});

(async () => {

    await server.register([
        {
            plugin: require("../dist")
        },
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

                setTimeout(function () {
                    ws.io.emit('login', { data: "Login Ok" });
                }, 5000);

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