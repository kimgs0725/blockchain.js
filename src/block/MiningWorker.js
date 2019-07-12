const {isMainThread, workerData, parentPort} = require('worker_threads');
const Block = require("./Block");

if (!isMainThread) {
    const blocks = workerData.blocks;
    let lastBlock = Block.from(blocks[blocks.length - 1]);

    while (true) {
        const newBlock = new Block(
            lastBlock.hash(),
            "0000000000000000000000000000000000000000000000000000000000000000",
            lastBlock.difficulty,
            Math.floor(new Date().getTime() / 1000)
        );
        newBlock.nonce = newBlock.pow();
        parentPort.postMessage(newBlock);
        lastBlock = newBlock;
    }
}
