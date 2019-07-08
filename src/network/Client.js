const WebSocketClient = require("websocket").client;
const utils = require("../utils");

class Client {
    constructor(hostname) {
        this.hostname = hostname;
    }

    connect = () => {
        this.client = new WebSocketClient();
        this.client.on("connectFailed", error => {
            this.connection = null;
            utils.log("Client", "Connection Error: " + error.toString());
        });

        this.client.on("connect", this._onConnect);

        this.client.connect(this.hostname, "dnext-chain");
    };

    _onConnect = connection => {
        utils.log("Client", "Connected (" + connection.remoteAddress + ")");
        connection.on("error", (error) => {
            utils.log("Client", "Error: " + error.toString());
        });
        connection.on("close", () => {
            utils.log("Client", "Connection closed");
        });
        connection.on("message", this._onMessage);
        this.connection = connection;
    };

    sendBlock = block => {
        const value = {
            prevHash: block.prevHash,
            difficulty: block.difficulty,
            timestamp: block.timestamp,
            nonce: block.nonce,
            txs: block.txs
        };
        this._sendMessage("block", value);
    };

    sendTx = tx => {
        const value = {
            inputs: tx.inputs,
            outputs: tx.outputs
        };
        this._sendMessage("tx", value);
    };

    _sendMessage = (type, value) => {
        const data = {
            type: type,
            value: value
        };
        this.connection.sendUTF(JSON.stringify(data));
        utils.log("Client", "Sent: " + JSON.stringify(data));
    };

    _onMessage = message => {
        const msg = message.utf8Data;
        utils.log("Client", "Received: " + msg);
    };
}

module.exports = Client;
