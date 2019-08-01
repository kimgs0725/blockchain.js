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

    getTxs() {
        const txs = [];
        for (const txHash of Object.keys(this.txs)) {
            const tx = this.txs[txHash];
            txs.push(tx);
        }
        return txs;
    }
}

module.exports = MemPool;
