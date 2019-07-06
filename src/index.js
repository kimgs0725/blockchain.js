const Bootstrap = require("./Bootstrap");
const Server = require("./Server");
const Client = require("./Client");
const ip = require('ip');

const server = new Server();
server.start();

(async () => {
    const bootstrap = new Bootstrap("http://192.168.35.2");
    const ipAddrs = await bootstrap.fetch();
    ipAddrs.filter(addr => addr !== ip.address()).forEach(addr => {
        const client = new Client("ws://" + addr + ":43210");
        client.connect();
    })
})();
