const WebSocketClient = require("websocket").client;
const utils = require("./utils");

class Client {
    constructor(hostname) {
        this.hostname = hostname;
    }

    connect = () => {
        const client = new WebSocketClient();
        client.on("connectFailed", error => {
            utils.log("Client", "Connection Error: " + error.toString());
        });

        client.on("connect", connection => {
            utils.log("Client", "Connected (" + connection.remoteAddress + ")");
            connection.on("error", (error) => {
                utils.log("Client", "Error: " + error.toString());
            });
            connection.on("close", () => {
                utils.log("Client", "Connection Closed");
            });
            connection.on("message", this._onMessage);
        });

        client.connect(this.hostname, "chain");
    };

    _onMessage = message => {
        const msg = JSON.parse(message.utf8Data);
        utils.log("Client", "Received: " + msg);
    };
}

module.exports = Client;
