const Hashes = require("jshashes");
const NodeRSA = require("node-rsa");

const Input = require("./Input");
const Output = require("./Output");
const Script = require("./Script");
const ScriptRunner = require("./ScriptRunner");
const utils = require("../utils");

class Tx {
    static from(object) {
        const inputs = [];
        for (const input of object.inputs) {
            inputs.push(Input.from(input));
        }
        const outputs = [];
        for (const output of object.outputs) {
            outputs.push(Output.from(output));
        }
        return new Tx(inputs, outputs);
    }

    static createCoinbase(publicKey) {
        const pubKeyHash = new Hashes.RMD160().hex(new Hashes.SHA256().hex(publicKey));
        const input = new Input("0000000000000000000000000000000000000000000000000000000000000000", -1, new Script([utils.toHex(new Date().getTime(), 8)]));
        const output = new Output(50 * 10 ** 8, new Script([Script.OP_DUP, Script.OP_HASH160, pubKeyHash, Script.OP_EQUALVERIFY, Script.OP_CHECKSIG]));
        return new Tx([input], [output]);
    }

    constructor(inputs = [], outputs = []) {
        this.inputs = inputs;
        this.outputs = outputs;
    }

    toHex() {
        let data = "";
        data += utils.toHex(this.inputs.length, 8);
        for (const input of this.inputs) {
            data += input.toHex();
        }
        data += utils.toHex(this.outputs.length, 8);
        for (const output of this.outputs) {
            data += output.toHex();
        }
        return data;
    }

    hash() {
        console.log(this.toHex());
        return new Hashes.SHA256().hex(this.toHex());
    }

    validate(memPool) {
        for (const input of this.inputs) {
            const tx = memPool.txs[input.txHash];
            if (!tx)
                return false;
            const utxo = tx.outputs[input.index];
            if (!utxo)
                return false;
            const runner = new ScriptRunner(utxo, input, this);
            if (runner.run() === false)
                return false;
        }
        return true;
    }

    sign(privateKey) {
        const key = new NodeRSA();
        key.importKey(Buffer.from(privateKey, "hex"), "pkcs1-private-der");

        const rawTransaction = this.toHex();
        const signature = key.sign(Buffer.from(rawTransaction, "hex")).toString("hex");
        const publicKey = key.exportKey("pkcs8-public-der").toString("hex");
        for (const input of this.inputs) {
            input.script.values.push(signature);
            input.script.values.push(publicKey);
        }
        return signature;
    }
}

module.exports = Tx;
