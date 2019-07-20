const utils = require("../utils");
const Script = require("./Script");

class Input {
    static from(object) {
        return new Input(object.txHash, object.index, Script.from(object.script));
    }

    constructor(txHash, index, script) {
        this.txHash = txHash;
        this.index = index;
        this.script = script;
    }

    toHex() {
        let data = this.txHash;
        data += utils.toHex(this.index);
        data += this.script.toHex();
        return data;
    }
}

module.exports = Input;
