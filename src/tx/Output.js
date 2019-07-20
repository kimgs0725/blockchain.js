const utils = require("../utils");
const Script = require("./Script");

class Output {
    static from(object) {
        return new Output(object.amount, Script.from(object.script));
    }

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
