const {Worker} = require('worker_threads');
const localIpV4Address = require("local-ipv4-address");
const utils = require("./utils");
const Bootstrap = require("./Bootstrap");
const Server = require("./Server");
const Client = require("./Client");
const Block = require("./block/Block");

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
        this._startServer();

        this.clients = [];
        const bootstrap = new Bootstrap("http://192.168.35.2");
        const myAddr = await localIpV4Address();
        const ipAddrs = await bootstrap.fetch();
        utils.log("Blockchain", ipAddrs);
        for (const addr of ipAddrs) {
            if (myAddr !== addr) {
                const client = this._startClient(addr);
                this.clients.push(client);
            }
        }
    };

    _sendMessage = (connection, type, value) => {
        if (connection && connection.connected) {
            const data = {
                type: type,
                value: value
            };
            connection.sendUTF(JSON.stringify(data));
            utils.log("Server", "Sent: " + JSON.stringify(data) + "  to " + connection.remoteAddress);
        }
    };

    _startServer = () => {
        this.server = new Server();
        this.server.on("getheaders", this._onGetheaders);
        this.server.on("headers", this._onHeaders);
        this.server.on("getdata", this._onGetdata);
        this.server.on("block", this._onBlock);
        this.server.start();
    };

    _startClient = addr => {
        const client = new Client("ws://" + addr + ":43210");
        client.on("getheaders", this._onGetheaders);
        client.on("headers", this._onHeaders);
        client.on("getdata", this._onGetdata);
        client.on("block", this._onBlock);
        client.on("connected", () => {
            client.sendMessage("getheaders", "");
        });
        client.connect();
        return client;
    };

    _onGetheaders = connection => {
        const headers = [];
        for (const block of this.blocks) {
            headers.push(block.header());
        }
        this._sendMessage(connection, "headers", headers);
    };

    _onHeaders = (connection, data) => {
        if (this.initializing) {
            if (data.length >= this.blocks) {
                this.blocks = [];
                this.blocks.push(Block.from(data));
            }
        }
    };

    _onGetdata = (connection, invs) => {
        for (const inv of invs) {
            for (const block of this.blocks) {
                if (block.hash === inv.hash) {
                    this._sendMessage(connection, "block", block);
                }
            }
        }
    };

    _onBlock = (connection, data) => {
        const newBlock = new Block(data.prevHash, data.merkleRoot, data.difficulty, data.timestamp, data.nonce, data.txs);
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
                    this._sendMessage(connection, "getdata", invs);
                    this.initializing = false;
                    this.startMining();
                    utils.log("Blockchain", "Finished downloading headers");
                } else {
                    this.stopMining();
                    this.startMining();
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

    startMining = () => {
        this.stopMining();
        utils.log("Blockchain", "Starting mining...");
        this.worker = new Worker("./src/block/MiningWorker.js", {workerData: {blocks: this.blocks}});
        this.worker.on("message", object => {
            const newBlock = Block.from(object);
            const blocks = this.blocks;
            let lastBlock = blocks[blocks.length - 1];
            if (lastBlock.hash() === newBlock.prevHash) {
                blocks.push(newBlock);
                utils.log("Blockchain", "Mined: " + newBlock.hash());
                for (const client of this.clients) {
                    client.sendMessage("block", newBlock);
                }
            }
        })
    };

    stopMining = () => {
        if (this.worker) {
            utils.log("Blockchain", "Stopping mining...");
            this.worker.terminate();
        }
    }
}

module.exports = Blockchain;
