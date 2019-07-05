const http = require("http");
const WebSocketServer = require("websocket").server;
const utils = require("./utils");

class Server {
    constructor() {
        this.httpServer = http.createServer((request, response) => {
            utils.log(request.url);
            response.writeHead(404);
            response.end();
        });
        this.httpServer.listen(43210, () => {
            utils.log("Server is listening on port 43210");
        });
    }

    start = () => {
        this.webSocket = new WebSocketServer({
            httpServer: this.httpServer,
            autoAcceptConnections: false
        });
        this.webSocket.on("request", request => {
            const connection = request.accept("chain", request.origin);
            utils.log("Connection accepted");
            connection.on("message", this._onMessage);
            connection.on("close", () => {
                utils.log(connection.remoteAddress + " disconnected");
            });
        });
    };

    _onMessage = message => {
        const msg = JSON.parse(message.utf8Data);
        utils.log("Server received: " + msg);
    };
}
module.exports = Server;
