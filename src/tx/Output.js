const utils = require("../utils");

class Output {
    constructor(amount, script) {
        this.amount = amount;
        this.script = script;
    }

    toHex() {
        let data = utils.toHex(this.amount, 16);
        data += this.script.toHex();
        return data;
    }
}

module.exports = Output;
