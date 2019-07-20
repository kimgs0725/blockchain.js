const Hashes = require("jshashes");
const NodeRSA = require("node-rsa");

const Script = require("./Script");

class ScriptRunner {
    constructor(output, input, inputTx) {
        this.script = input.script.values.concat(output.script.values);
        this.inputTx = inputTx;
        for (const input of this.inputTx.inputs) {
            input.script = new Script();
        }
        this.stack = [];
    }

    run() {
        for (const value of this.script) {
            let success = true;
            if (value === Script.OP_DUP) {
                success = this.op_dup();
            } else if (value === Script.OP_HASH160) {
                success = this.op_hash160();
            } else if (value === Script.OP_EQUALVERIFY) {
                success = this.op_equalverify();
            } else if (value === Script.OP_CHECKSIG) {
                success = this.op_checksig();
            } else {
                this.stack.push(value);
            }
            if (!success) {
                return false;
            }
        }
        if (this.stack.length === 1) {
            return Number(this.stack.pop()) === 1;
        } else {
            return false;
        }
    }

    op_dup() {
        if (this.stack.length >= 1) {
            const top = this.stack[this.stack.length - 1];
            this.stack.push(top);
            return true;
        } else {
            return false;
        }
    }

    op_hash160() {
        if (this.stack.length >= 1) {
            const top = this.stack.pop();
            const hash = new Hashes.RMD160().hex(new Hashes.SHA256().hex(top));
            this.stack.push(hash);
            return true;
        } else {
            return false;
        }
    }

    op_equalverify() {
        if (this.stack.length >= 2) {
            const first = this.stack.pop();
            const second = this.stack.pop();
            return first === second;
        } else {
            return false;
        }
    }

    op_checksig() {
        if (this.stack.length >= 2) {
            const key = new NodeRSA();
            const publicKey = this.stack.pop();
            const signature = this.stack.pop();
            key.importKey(Buffer.from(publicKey, "hex"), "pkcs8-public-der");
            if (key.verify(Buffer.from(this.inputTx.toHex(), "hex"), Buffer.from(signature, "hex"))) {
                this.stack.push("01");
                return true;
            }
        } else {
            return false;
        }
    }
}

module.exports = ScriptRunner;
