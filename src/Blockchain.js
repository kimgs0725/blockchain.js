const localIpV4Address = require("local-ipv4-address");

const Bootstrap = require("./Bootstrap");
const Server = require("./Server");
const Client = require("./Client");
const Block = require("./Block");

class Blockchain {
    // 00000ce02084822c48ac519f9e9cce3ed9190014323021f2d4905ad524fe270d
    static GENESIS_BLOCK = new Block(
        "0000000000000000000000000000000000000000000000000000000000000000",
        "0000000000000000000000000000000000000000000000000000000000000000",
        "00000fffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
        1231006505,
        416337
    );

    constructor() {
        this.blocks = [Blockchain.GENESIS_BLOCK];
        this.initializing = true;
    }

    start = async () => {
        this.startServer();

        this.clients = [];
        const bootstrap = new Bootstrap("http://192.168.35.2");
        const myAddr = await localIpV4Address();
        const ipAddrs = await bootstrap.fetch();
        for (const addr of ipAddrs) {
            if (myAddr !== addr) {
                const client = this.startClient(addr);
                this.clients.push(client);
            }
        }
    };

    startServer = () => {
        this.server = new Server();
        this.server.on("getheaders", this._onGetheaders);
        this.server.on("headers", this._onHeaders);
        this.server.on("getdata", this._onGetdata);
        this.server.on("block", this._onBlock);
        this.server.start();
    };

    startClient = addr => {
        const client = new Client("ws://" + addr + ":43210");
        client.on("getheaders", this._onGetheaders);
        client.on("headers", this._onHeaders);
        client.on("getdata", this._onGetdata);
        client.on("block", this._onBlock);
        client.connect();
        client.sendMessage("getheaders", null);
        return client;
    };

    _onGetheaders = connection => {
        const headers = [];
        for (const block of this.blocks) {
            headers.push(block.header());
        }
        const data = {type: "headers", value: headers};
        connection.sendUTF(JSON.stringify(data));
    };

    _onHeaders = (connection, headers) => {
        if (this.initializing) {
            if (value.length >= this.blocks) {
                this.blocks = headers;
            }
        }
    };

    _onGetdata = (connection, invs) => {
        for (const inv of invs) {
            for (const block of this.blocks) {
                if (block.hash === inv.hash) {
                    const data = {type: "block", value: block};
                    connection.sendUTF(JSON.stringify(data));
                }
            }
        }
    };

    _onBlock = (connection, newBlock) => {
        if (newBlock.validate()) {
            const lastBlock = this.blocks[this.blocks.length - 1];
            if (lastBlock.hash() === newBlock.prevHash) {
                this.blocks.push(newBlock);
                if (this.initializing) {
                    const invs = [];
                    for (const block of this.blocks) {
                        invs.push({
                            type: "block",
                            hash: block.hash()
                        });
                    }
                    const data = {type: "getdata", value: invs};
                    connection.sendUTF(JSON.stringify(data));
                    this.initializing = false;
                }
            } else if (this.initializing) {
                const hash = newBlock.hash();
                for (let i = 0; i < this.blocks.length; i++) {
                    if (this.blocks[i].txs.length === 0 && this.blocks[i].hash() === hash) {
                        this.blocks[i] = newBlock;
                    }
                }
            }
        }
    };
}

module.exports = Blockchain;
