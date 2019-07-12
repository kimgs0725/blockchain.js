const WebSocketClient = require("websocket").client;
const utils = require("./utils");

class Client {
    constructor(hostname) {
        this.hostname = hostname;
        this.listeners = {};
    }

    on = (type, listener) => {
        this.listeners[type] = listener;
    };

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
        connection.on("message", message => this._onMessage(message, connection));
        this.connection = connection;
        if (this.listeners["connected"]) {
            this.listeners["connected"]();
        }
    };

    sendMessage = (type, value) => {
        if (this.connection.connected) {
            const data = {
                type: type,
                value: value
            };
            this.connection.sendUTF(JSON.stringify(data));
            utils.log("Client", "Sent: " + JSON.stringify(data));
        }
    };

    _onMessage = (message, connection) => {
        const data = JSON.parse(message.utf8Data);
        utils.log("Server", "Received: " + message.utf8Data);
        if (this.listeners[data.type]) {
            this.listeners[data.type](connection, data.value);
        }
    };
}

module.exports = Client;
