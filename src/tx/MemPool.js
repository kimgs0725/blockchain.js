class MemPool {
    constructor() {
        this.txs = {};
    }

    addTx(tx) {
        this.txs[tx.hash()] = tx;
    }

    removeTx(txHash) {
        delete this.txs[txHash];
    }
}

module.exports = MemPool;
