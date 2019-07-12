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
            connection.on("message", this._onMessage);
            connection.on("close", this._onClose);
            this.connection = connection;
        } catch (e) {
            utils.log("Server", "Accept error: " + e.message);
        }
    };

    _onMessage = message => {
        const data = JSON.parse(message.utf8Data);
        utils.log("Server", "Received: " + message.utf8Data);
        if (this.listeners[data.type]) {
            this.listeners[data.type](this, data.value);
        }
    };

    _onClose = (reason, description) => {
        utils.log("Server", "Disconnected (" + reason + ", " + description + ")");
    };

    sendMessage = (type, value) => {
        if (this.connection && this.connection.connected) {
            const data = {
                type: type,
                value: value
            };
            this.connection.sendUTF(JSON.stringify(data));
            utils.log("Server", "Sent: " + JSON.stringify(data));
        }
    };
}

module.exports = Server;
