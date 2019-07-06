const http = require("http");
const WebSocketServer = require("websocket").server;
const utils = require("./utils");

class Server {
    constructor() {
        this.httpServer = http.createServer((request, response) => {
            utils.log("Server", request.url);
            response.writeHead(404);
            response.end();
        });
        this.httpServer.listen(43210, () => {
            utils.log("Server", "Listening on port 43210");
        });
    }

    start = () => {
        this.webSocket = new WebSocketServer({
            httpServer: this.httpServer,
            autoAcceptConnections: false
        });
        this.webSocket.on("request", request => {
            const connection = request.accept("chain", request.origin);
            utils.log("Server", "Connection accepted (" + request.remoteAddress + ")");
            connection.on("message", this._onMessage);
            connection.on("close", () => {
                utils.log("Server", "Disconnected (" + connection.remoteAddress + ")");
            });
        });
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
}
module.exports = Server;
