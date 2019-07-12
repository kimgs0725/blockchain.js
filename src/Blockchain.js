const Block = require("./block/Block");

class Blockchain {
    static instance = new Blockchain();

    constructor() {
        this.blocks = [Block.GENESIS];
    }
}

module.exports = Blockchain;
