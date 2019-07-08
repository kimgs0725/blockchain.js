const Hashes = require("jshashes");
const utils = require("../utils");

class Block {
    // 0x0000045e4eb614027b96b317f034f474a284d4dd7653ec0a26284a7024005339
    static GENESIS = new Block(
        "0000000000000000000000000000000000000000000000000000000000000000",
        "00000fffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
        1231006505);

    constructor(prevHash, difficulty, timestamp, nonce = 0, txs = []) {
        this.prevHash = prevHash;
        this.difficulty = difficulty;
        this.timestamp = timestamp;
        this.nonce = nonce;
        this.txs = txs;
    }

    toHex() {
        let data = "";
        data += this.prevHash;
        data += utils.toHex(this.timestamp, 8);
        data += utils.toHex(this.nonce, 8);
        for (const tx of this.txs) {
            data += tx.toHex();
        }
        return data;
    }

    hash() {
        return new Hashes.SHA256().hex(this.toHex());
    }

    pow() {
        const difficulty = Buffer.from(this.difficulty, "hex");
        for (let nonce = 0; nonce < 2^256 - 1; nonce++) {
            this.nonce = nonce;
            const hash = this.hash();
            if (Buffer.from(hash, "hex").compare(difficulty) < 0) {
                return hash;
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
