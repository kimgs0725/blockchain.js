const http = require("http");
const WebSocketServer = require("websocket").server;
const utils = require("./utils");

class Server {
    constructor() {
        this.listeners = {};
    }

    on = (type, listener) => {
        this.listeners[type] = listener;
    };

    start = () => {
        const httpServer = http.createServer((request, response) => {
            utils.log("Server", request.url);
            response.writeHead(404);
            response.end();
        });
        httpServer.listen(43210, () => {
            utils.log("Server", "Listening on port 43210");
        });

        this.webSocket = new WebSocketServer({
            httpServer: httpServer,
            autoAcceptConnections: false
        });
        this.webSocket.on("request", this._onRequest);
    };

    _onRequest = request => {
        try {
            const connection = request.accept("dnext-chain", request.origin);
            utils.log("Server", "Connection accepted (" + request.remoteAddress + ")");
            connection.on("message", message => this._onMessage(connection, message));
            connection.on("close", this._onClose);
            if (this.listeners["connected"]) {
                this.listeners["connected"](connection);
            }
        } catch (e) {
            utils.log("Server", "Accept error: " + e.message);
        }
    };

    _onMessage = (connection, message) => {
        const data = JSON.parse(message.utf8Data);
        utils.log("Server", "Received: " + message.utf8Data + " from " + connection.remoteAddress);
        if (this.listeners[data.type]) {
            this.listeners[data.type](connection, data.value);
        }
    };

    _onClose = (reason, description) => {
        utils.log("Server", "Disconnected (" + reason + ", " + description + ")");
    };
}

module.exports = Server;
