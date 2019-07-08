const Hashes = require("jshashes");
const utils = require("../utils");

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
}

module.exports = Tx;
