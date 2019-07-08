class TxPool {
    static instance = new TxPool();

    constructor() {
        this.txs = {};
    }
}

module.exports = TxPool;
