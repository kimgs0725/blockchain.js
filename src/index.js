const Blockchain = require("./Blockchain");

// const Block = require("./Block");
// const Tx = require("./tx/Tx");
// const Input = require("./tx/Input");
// const Output = require("./tx/Output");
// const Script = require("./tx/Script");
// const TxPool = require("./tx/TxPool");

// server.on("tx", tx => {
//     if (tx.validate()) {
//         TxPool.instance.txs[tx.hash()] = tx;
//     }
// });
// const tx = new Tx();
// tx.inputs.push(new Input("0000000000000000000000000000000000000000000000000000000000000000", 16, new Script()));
// tx.outputs.push(new Output(100, new Script()));
//
// let block = new Block(
//     "0000045e4eb614027b96b317f034f474a284d4dd7653ec0a26284a7024005339",
//     Math.floor(new Date().getTime() / 1000),
//     Blockchain.GENESIS_BLOCK.difficulty
// );
// while (true) {
//     let start = new Date();
//     const hash = block.pow();
//     let end = new Date();
//     console.log((end.getTime() - start.getTime()) / 1000);
//     block = new Block(hash, Math.floor(end.getTime() / 1000), block.difficulty);
// }

const blockchain = new Blockchain();
blockchain.start();
