const Hashes = require("jshashes");
const utils = require("../utils");
const NodeRSA = require("node-rsa");

class Tx {
    constructor(inputs = [], outputs = []) {
        this.inputs = inputs;
        this.outputs = outputs;
    }

    toHex() {
        let data = "";
        data += utils.toHex(this.inputs.length);
        for (const input of this.inputs) {
            data += input.toHex();
        }
        data += utils.toHex(this.outputs.length);
        for (const output of this.outputs) {
            data += output.toHex();
        }
        return data;
    }

    hash() {
        return new Hashes.SHA256().hex(this.toHex());
    }

    validate() {
        return true; // TODO: run scripts
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
