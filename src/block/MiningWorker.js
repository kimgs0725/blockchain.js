const {isMainThread, workerData, parentPort} = require('worker_threads');
const Block = require("./Block");
const MerkleTree = require('@garbados/merkle-tree');
const Tx = require("../tx/Tx");

if (!isMainThread) {
    const blocks = workerData.blocks;
    let txs = workerData.txs;
    parentPort.on("message", newTxs => {
        txs = newTxs;
    });
    let lastBlock = Block.from(blocks[blocks.length - 1]);
    while (true) {
        const txData = [];
        for (const tx of txs) {
            txData.push(Tx.from(tx).toHex());
        }
        const merkleTree = new MerkleTree("sha256", txData);
        const newBlock = new Block(lastBlock.hash(),
            merkleTree.root,
            lastBlock.difficulty, Math.floor(new Date().getTime() / 1000), 0, txs);
        newBlock.nonce = newBlock.pow();
        parentPort.postMessage(newBlock);
        lastBlock = newBlock;
    }
}