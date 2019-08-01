const utils = require("../utils");

class Script {
    static OP_DUP = "76";
    static OP_HASH160 = "a9";
    static OP_EQUALVERIFY = "88";
    static OP_CHECKSIG = "ac";

    static from(object) {
        return new Script(object.values);
    }

    constructor(values = []) {
        this.values = values;
    }

    toHex() {
        let data = utils.toHex(this.values.length, 8);
        for (const value of this.values) {
            data += value;
        }
        return data;
    }
}

module.exports = Script;
