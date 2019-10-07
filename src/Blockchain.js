const {Worker} = require('worker_threads');
const localIpV4Address = require("local-ipv4-address");
const utils = require("./utils");
const Bootstrap = require("./Bootstrap");
const Server = require("./Server");
const Client = require("./Client");
const Block = require("./block/Block");
const Tx = require("./tx/Tx");
const MemPool = require("./tx/MemPool");
const Input = require("./tx/Input");
const Output = require("./tx/Output");
const Script = require("./tx/Script");
const NodeRSA = require("node-rsa");
const Hashes = require("jshashes");


class Blockchain {
    // 00000ce02084822c48ac519f9e9cce3ed9190014323021f2d4905ad524fe270d
    static GENESIS_BLOCK = new Block(
        "0000000000000000000000000000000000000000000000000000000000000000",
        "0000000000000000000000000000000000000000000000000000000000000000",
        "00000fffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
        1231006505,
        416337
    );

    constructor(privateKey) {
        this.blocks = [Blockchain.GENESIS_BLOCK];
        this.initializing = true;
        this.memPool = new MemPool();

        this.key = new NodeRSA();
        this.key.importKey(Buffer.from(privateKey, "hex"), "pkcs1-private-der");
    }

    start = async () => {
        this._startServer();

        this.clients = [];
        const bootstrap = new Bootstrap("http://192.168.35.2");
        const myAddr = await localIpV4Address();  // async한 함수이지만 sync를 맞춰줌.
        const ipAddrs = await bootstrap.fetch();  // async한 함수이지만 sync를 맞춰줌.
        utils.log("Blockchain", ipAddrs);
        for (const addr of ipAddrs) {
            if (myAddr !== addr) {
                const client = this._startClient(addr);
                this.clients.push(client);
            }
        }
    };

    startMining = () => {
        this.stopMining();
        utils.log("Blockchain", "Starting mining...");
        const publicKey = this.key.exportKey("pkcs8-public-der").toString("hex");
        const coinbase = Tx.createCoinbase(publicKey);
        const txs = [coinbase].concat(this.memPool.getTxs());
        // Work Thread 생성 (Mining Worker)
        this.worker = new Worker("./src/block/MiningWorker.js", {
            workerData:{
                blocks: this.blocks,
                txs: txs
            }
        });
        this.worker.on("message", object => {
            // 마이닝에 성공하면 해당 로직을 수행.
            const newBlock = Block.from(object);
            const blocks = this.blocks;
            let lastBlock = blocks[blocks.length - 1];
            if (lastBlock.hash() === newBlock.prevHash) {
                this._addBlock(newBlock);
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

    getBalance = () => {
        const publicKey = this.key.exportKey("pkcs8-public-der").toString("hex");
        const pubKeyHash = new Hashes.RMD160().hex(new Hashes.SHA256().hex(publicKey));
        let balance = 0;
        for (const tx of this.memPool.getTxs()) {
            for (const output of tx.outputs) {
                for (const value of output.script.values) {
                    if (value === pubKeyHash) {
                        balance += output.amount;
                    }
                }
            }
        }
        return balance;
    };

    _startServer = () => {
        this.server = new Server();
        this.server.on("getheaders", this._onGetheaders);
        this.server.on("headers", this._onHeaders);
        this.server.on("getdata", this._onGetdata);
        this.server.on("block", this._onBlock);
        this.server.on("connected", connection => {
            if (!connection.socket.remoteAddress.endsWith("127.0.0.1")) {
                let addr = connection.socket.remoteAddress;
                if (addr.startsWith("::ffff:")) {
                    addr = addr.substring(7);
                }
                const client = this._startClient(addr);
                this.clients.push(client);
            }
        });
        this.server.start();
    };

    _startClient = addr => {
        const client = new Client("ws://" + addr + ":43210");
        client.on("getheaders", this._onGetheaders);
        client.on("headers", this._onHeaders);
        client.on("getdata", this._onGetdata);
        client.on("block", this._onBlock);
        client.on("connected", () => {
            client.sendMessage("getheaders", null);
            setTimeout(() => {
                const inputs = [new Input("0000000000000000000000000000000000000000000000000000000000000000",
                                          0, new Script())];
                const outputs = [new Output(100, new Script([Script.OP_DUP, Script.OP_HASH160, "0000000000000000000000000000000000000000000000000000000000000000", Script.OP_EQUALVERIFY, Script.OP_CHECKSIG]))];
                const tx = new Tx(inputs, outputs);
                client.sendMessage("tx", tx);
            })
        });
        client.connect();
        return client;
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

    _addBlock = block => {
        this.blocks.push(block);
        for (const tx of block.txs) {
            for (const input of tx.inputs) {
                this.memPool.removeTx(input.txHash);
            }
            this.memPool.addTx(tx);
        }
        utils.log("Blockchain", "Block Height: " + this.blocks.length);
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
            const isValid = data.map(Block.from).every(header => header.validate());
            if (isValid && this.blocks.length < data.length) {
                this.blocks = [];
                for (const header of data) {
                    const block = Block.from(header);
                    this.blocks.push(block);
                }
            }
        }
    };

    _onGetdata = (connection, invs) => {
        for (const inv of invs) {
            for (const block of this.blocks) {
                if (block.hash() === inv.hash) {
                    this._sendMessage(connection, "block", block);
                }
            }
        }
    };

    _onBlock = (connection, data) => {
        const newBlock = Block.from(data);
        if (newBlock.validate(this.memPool)) {
            const lastBlock = this.blocks[this.blocks.length - 1];
            if (lastBlock.hash() === newBlock.prevHash) {
                this._addBlock(newBlock);
                if (this.initializing) {
                    // 마지막 블록의 해쉬와 새로 들어온 블록의 prevHash와 동일하면
                    // 더 이상 헤더 동기화를 할 필요가 없기 때문에 본격적으로
                    // 마이닝에 참여
                    this.initializing = false;
                    utils.log("Blockchain", "Finished downloading headers");
                    const invs = [];
                    for (const block of this.blocks) {
                        invs.push({
                            type: "block",
                            hash: block.hash()
                        });
                    }
                    // 어! 나 헤더 동기화 끝났으니 이 블록헤더에 해당하는 블록 좀 줄래?
                    this._sendMessage(connection, "getdata", invs);
                    this.startMining();
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
            // 블록동기화하는 부분이 빠진것 같다...
        }
    };

    _onTx = (connection, data) => {
        const tx = Tx.from(data);
        if (tx.validate(this.memPool)) {
            this.memPool.addTx(tx);
        }
        if (this.worker) {
            const publicKey = this.key.exportKey("pkcs8-publicder").toString("hex");
            const coinbase = Tx.createCoinbase(publicKey);
            const txs = [coinbase].concat(this.memPool.getTxs());
            this.worker.postMessage(txs);
        }
    };

}

module.exports = Blockchain;
