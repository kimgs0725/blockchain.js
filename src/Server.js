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
            connection.on("message", message => this._onMessage(message, connection));
            connection.on("close", this._onClose);
        } catch (e) {
            utils.log("Server", "Accept error: " + e.message);
        }
    };

    _onMessage = (message, connection) => {
        const data = JSON.parse(message.utf8Data);
        utils.log("Server", "Received: " + message.utf8Data);
        if (this.listeners[data.type]) {
            this.listeners[data.type](connection, data.value);
        }
    };

    _onHeaders = value => {
        const headers = [];
        for (const v of value) {
            headers.push(new Block(v.prevHash, v.merkleRoot, v.difficulty, v.timestamp, v.nonce));
        }
        if (this.listeners["headers"]) {
            this.listeners["headers"](headers);
        }
    };

    _onBlock = value => {
        const block = new Block(value.prevHash, value.merkleRoot, value.difficulty, value.timestamp, value.nonce, value.txs);
        if (this.listeners["block"]) {
            this.listeners["block"](block);
        }
    };

    _onClose = connection => {
        utils.log("Server", "Disconnected (" + connection.remoteAddress + ")");
    };
}

module.exports = Server;
