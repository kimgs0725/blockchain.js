const WebSocketClient = require("websocket").client;
const NodeRSA = require("node-rsa");
const utils = require("./utils");

const PUB_KEY = "303c300d06092a864886f70d0101010500032b003028022100b8be42a7593c3e4d9605476ddfcf73fd95b86901f05af77dc2ea77d823dc01790203010001";
const PRIV_KEY = "3081aa020100022100b8be42a7593c3e4d9605476ddfcf73fd95b86901f05af77dc2ea77d823dc01790203010001022042b09c0b215178043605cdd54217f77c935200a38443f5e98d9da10c44127769021100f343064c66ab234d9225bd59ee059bbb021100c26ac8158d6a349b7ecbb62a71d7925b021039ed3df4b7860d340d973b0dcd263cbd02105c15799983b6971e434b3788190db2db0211008610a279cd31d66169eba5cffebcfae8";

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
