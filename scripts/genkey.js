const NodeRSA = require("node-rsa");
const Hashes = require("jshashes");

const key = new NodeRSA({ b: 1024 });
const privateKey = key.exportKey("pkcs1-private-der").toString("hex");
const publicKey = key.exportKey("pkcs8-public-der").toString("hex");
const address = "0x" + new Hashes.RMD160().hex(new Hashes.SHA256().hex(publicKey));
console.log("PrivKey: " + privateKey);
console.log("PubKey: " + publicKey);
console.log("Address: " + address);
