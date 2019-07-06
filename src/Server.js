const http = require("http");
const WebSocketServer = require("websocket").server;
const utils = require("./utils");

class Server {
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
        const connection = request.accept("dnext-chain", request.origin);
        utils.log("Server", "Connection accepted (" + request.remoteAddress + ")");
        connection.on("message", this._onMessage);
        connection.on("close", this._onClose);
    };

    _onMessage = message => {
        const data = JSON.parse(message.utf8Data);
        utils.log("Server", "Received: " + this._decrypt(data));
    };

    _decrypt = data => {
        const key = new NodeRSA();
        const publicKey = Buffer.from(data.publicKey, "hex");
        key.importKey(publicKey, "pkcs8-public-der");
        return key.decryptPublic(Buffer.from(data.cipher, "hex")).toString("utf8");
    };

    _onClose = connection => {
        utils.log("Server", "Disconnected (" + connection.remoteAddress + ")");
    };
}
module.exports = Server;
