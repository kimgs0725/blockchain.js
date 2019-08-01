const Hashes = require("jshashes");
const utils = require("../utils");
const Tx = require("../tx/Tx");
const MerkleTree = require('@garbados/merkle-tree');
class Block {
    static from(object) {
        const txs = [];
        for (const tx of object.txs) {
            txs.push(Tx.from(tx));
        }
        return new Block(object.prevHash, object.merkleRoot,object.difficulty, object.timestamp, object.nonce, txs);
    }

    constructor(prevHash = "0000000000000000000000000000000000000000000000000000000000000000",
                merkleRoot = "0000000000000000000000000000000000000000000000000000000000000000", 
                difficulty = "00000fffffffffffffffffffffffffffffffffffffffffffffffffffffffffff", 
                timestamp = 0, nonce = 0, txs = []) {
        this.prevHash = prevHash;
        this.merkleRoot = merkleRoot;
        this.difficulty = difficulty;
        this.timestamp = timestamp;
        this.nonce = nonce;
        this.txs = txs;
    }

    header() {
        return new Block(
            this.prevHash,
            this.merkleRoot,
            this.difficulty,
            this.timestamp,
            this.nonce
        );
    }

    toHex() {
        let data = "";
        data += this.prevHash;
        data += this.merkleRoot;
        data += utils.toHex(this.timestamp, 8);
        data += utils.toHex(this.nonce, 8);
        return data;
    }

    hash() {
        return new Hashes.SHA256().hex(this.toHex());
    }

    pow() {
        const difficulty = Buffer.from(this.difficulty, "hex");
        for (let nonce = 0; nonce <= 2 ^ 32 - 1; nonce++) {
            this.nonce = nonce;
            const hash = this.hash();
            if (Buffer.from(hash, "hex").compare(difficulty) < 0) {
                return nonce;
            }
        }
    }

    validate(memPool) {
        // const hash = this.hash();
        // const difficulty = Buffer.from(this.difficulty, "hex");
        // return Buffer.from(hash, "hex").compare(difficulty) < 0;
        // TODO: validate txs
        const hash = this.hash();
        const difficulty = Buffer.from(this.difficulty, "hex");
        if (Buffer.from(hash, "hex").compare(difficulty) < 0) {
            // Verify coinbase
            const coinbase = this.txs[0];
            if (!coinbase) 
                return false;

            if (coinbase.inputs.length !== 1)
                return false;

            if (coinbase.inputs[0].txHash !== "0000000000000000000000000000000000000000000000000000000000000000" ||
                coinbase.inputs[0].index !== -1)
                return false;

            if (coinbase.outputs.length !== 1)
                return false;

            if (coinbase.outputs[0].amount != 50 * 10 ** 8)
                return false;

            // Verify merkle tree
            const txData = [];
            for (const tx of this.txs) {
                txData.push(Tx.from(tx).toHex());
            }
            const merkleTree = new MerkleTree("sha256", txData);
            if (this.merkleRoot !== merkleTree.root)
                return false;

            // Verify txs
            for (const tx of this.txs) {
                if (!tx.validate(memPool)) {
                    return false;
                }
            }
            return true;
        } else {
            return false;
        }
    }
}

module.exports = Block;
