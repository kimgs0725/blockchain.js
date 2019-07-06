const WebSocketClient = require("websocket").client;
const utils = require("./utils");
const NodeRSA = require("node-rsa");

const PUB_KEY = "";
const PRIV_KEY = "";

class Client {
    constructor(hostname) {
        this.hostname = hostname;
    }

    connect = () => {
        this.client = new WebSocketClient();
        this.client.on("connectFailed", error => {
            utils.log("Client", "Connection Error: " + error.toString());
        });

        this.client.on("connect", connection => {
            utils.log("Client", "Connected (" + connection.remoteAddress + ")");
            connection.on("error", (error) => {
                utils.log("Client", "Error: " + error.toString());
            });
            connection.on("close", () => {
                utils.log("Client", "Connection closed");
            });
            connection.on("message", this._onMessage);
            this._sendMessage(connection);
        });

        this.client.connect(this.hostname, "chain");
    };

    _sendMessage = connection => {
        const data = {
            publicKey: PUB_KEY,
            cipher: this._encrypt("Hello")
        };
        connection.sendUTF(JSON.stringify(data))
    };

    _encrypt = plain => {
        const key = new NodeRSA();
        const privateKey = Buffer.from(PRIV_KEY, "hex");
        key.importKey(privateKey, "pkcs1-private-der");
        return key.encryptPrivate(Buffer.from(plain, "utf8")).toString("hex");
    };

    _onMessage = message => {
        const msg = JSON.parse(message.utf8Data);
        utils.log("Client", "Received: " + msg);
    };
}

module.exports = Client;
