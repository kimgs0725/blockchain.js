const Block = require("./block/Block");

class Blockchain {
    static instance = new Blockchain();

    constructor() {
        this.blocks = [Block.GENESIS];
        this.orphans = [];
    }
}

module.exports = Blockchain;
