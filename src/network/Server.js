const http = require("http");
const WebSocketServer = require("websocket").server;
const Blockchain = require("../Blockchain");
const Block = require("../block/Block");
const Tx = require("../tx/Tx");
const TxPool = require("../tx/TxPool");
const utils = require("../utils");

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
        try {
            const connection = request.accept("dnext-chain", request.origin);
            utils.log("Server", "Connection accepted (" + request.remoteAddress + ")");
            connection.on("message", this._onMessage);
            connection.on("close", this._onClose);
        } catch (e) {
            utils.log("Server", "Accept error: " + e.message);
        }
    };

    _onMessage = message => {
        utils.log("Server", "Received: " + message.utf8Data);
        const data = JSON.parse(message.utf8Data);
        if (data.type === "block") {
            this._onReceiveBlock(data.value);
        } else if (data.type === "tx") {
            this._onReceiveTx(data.value);
        }
    };

    _onReceiveBlock = value => {
        const block = new Block(value.prevHash, value.difficulty, value.timestamp, value.nonce, value.txs);
        if (block.validate()) {
            const blocks = Blockchain.instance.blocks;
            if (blocks[blocks.length - 1].hash() === block.prevHash) {
                blocks.push(block);
            }
        }
    };

    _onReceiveTx = value => {
        const tx = new Tx(value.inputs, value.outputs);
        if (tx.validate()) {
            TxPool.instance.txs[tx.hash()] = tx;
        }
    };

    _onClose = connection => {
        utils.log("Server", "Disconnected (" + connection.remoteAddress + ")");
    };
}
module.exports = Server;
