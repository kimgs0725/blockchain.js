const utils = require("../utils");

class Input {
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
