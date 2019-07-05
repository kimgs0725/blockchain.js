const WebSocketClient = require("websocket").client;
const utils = require("./utils");

class Client {
    constructor(hostname) {
        this.hostname = hostname;
    }

    connect = () => {
        const client = new WebSocketClient();
        client.on('connectFailed', error => {
            utils.log('Connection Error: ' + error.toString());
        });

        client.on('connect', connection => {
            utils.log('Connected');
            connection.on('error', (error) => {
                utils.log("Error: " + error.toString());
            });
            connection.on('close', () => {
                utils.log('Connection Closed');
            });
            connection.on('message', this._onMessage);
        });

        client.connect(this.hostname, "chain");
    };

    _onMessage = message => {
        const msg = JSON.parse(message.utf8Data);
        utils.log("Client received: " + msg);
    };
}

module.exports = Client;
