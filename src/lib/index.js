'use strict';
var Hoek = require('hoek'),
    Socket = require('socket.io'),
    pkg = require('../../package.json');

exports.plugin = {
    name: pkg.name,
    version: pkg.version,
    pkg: pkg,
    register: (server, options) => {
        options = Hoek.applyToDefaults({ socket: { path: '/socket.io' } }, options);
        server = options.label ? server.select(options.label) : server;

        var io = Socket(server.listener, options.socket);
        server.expose('io', io);

        // namespaces
        var nsps = {};
        nsps['/'] = io.of('/');
        if (Array.isArray(options.namespaces)) {
            options.namespaces.forEach(function (namespace) {
                nsps[namespace] = io.of(namespace);
            });
        }


        /*  check whether a HAPI route has WebSocket enabled  */
        const isRouteWebSocket = (route) => {
            return (
                typeof route === "object"
                && typeof route.settings === "object"
                && typeof route.settings.plugins === "object"
                && typeof route.settings.plugins.websocket !== "undefined"
            )
        };

        /*  check whether a HAPI request is WebSocket driven  */
        const isRequestWebSocket = (request) => {
            return (
                typeof request === "object"
                && typeof request.plugins === "object"
                && typeof request.plugins.websocket === "object"
                && request.plugins.websocket.mode === "websocket"
            )
        };

        Object.keys(nsps).forEach(function (namespace) {
            nsps[namespace].on('connection', function (socket) {

                server.table().forEach(function (route) {

                    if (!isRouteWebSocket(route)) return;

                    if (route.method.toUpperCase() !== "POST")
                        throw new Error("WebSocket protocol can be enabled on POST routes only");

                    var config = route.settings.plugins['websocket'];
                    var isBasic = typeof config === 'string';

                    var event = isBasic ? config : config.event;
                    var ns = !isBasic && config.namespace ? config.namespace : '/';

                    if (ns !== namespace) return;

                    socket.on(event, async (data, callback) => {

                        // console.log('on event', event);

                        var req = socket.request;
                        var headers = Object.assign({}, req.headers);
                        delete headers["accept-encoding"];

                        /*  re-encode data as JSON as HAPI want to decode it  */
                        let payload = JSON.stringify(data);


                        /*  inject incoming WebSocket message as a simulated HTTP request  */
                        let res = await server.inject({
                            /*  simulate the hard-coded POST request  */
                            method: "POST",
                            /*  pass-through initial HTTP request information  */
                            url: route.path || '/',
                            headers: headers,
                            remoteAddress: req.address,

                            /*  provide WebSocket message as HTTP POST payload  */
                            payload: payload,

                            /*  provide WebSocket plugin context information  */
                            plugins: {
                                websocket: { mode: "websocket", io, socket, req }
                            }
                        });

                        var context = {
                            io: io,
                            socket: socket,
                            event: event,
                            data: data,
                            req: req,
                            res: res,
                            result: res.result
                        };

                        if (config.emit) {
                            return config.emit(context, callback);
                        }

                        callback(res.result);

                        //return res;

                    });

                });

            });
        });


        //server.decorate('request', 'websocket', function () { return {} }, { apply: true });
        // server.ext('onPostAuth', (request, h) => {
        //     if (isRequestWebSocket(request))
        //         request.websocket = request.plugins.websocket;

        //     return h.continue;
        // });

        /*  allow WebSocket information to be easily retrieved  */
        server.decorate("request", "websocket", (request) => { return isRequestWebSocket(request) ? request.plugins.websocket : { mode: "http" }; }, { apply: true });



    }
}
