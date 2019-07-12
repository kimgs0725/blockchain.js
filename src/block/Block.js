const Hashes = require("jshashes");
const utils = require("../utils");

class Block {
    constructor(prevHash, merkleRoot, difficulty, timestamp, nonce = 0, txs = []) {
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
        for (let nonce = 0; nonce < 2 ^ 256 - 1; nonce++) {
            this.nonce = nonce;
            const hash = this.hash();
            if (Buffer.from(hash, "hex").compare(difficulty) < 0) {
                return nonce;
            }
        }
    }

    validate() {
        const hash = this.hash();
        const difficulty = Buffer.from(this.difficulty, "hex");
        return Buffer.from(hash, "hex").compare(difficulty) < 0; // TODO: validate txs
    }
}

module.exports = Block;
