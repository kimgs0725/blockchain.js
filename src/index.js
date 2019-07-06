const Bootstrap = require("./Bootstrap");
const Server = require("./Server");
const Client = require("./Client");
const localIpV4Address = require("local-ipv4-address");

const server = new Server();
server.start();

(async () => {
    const bootstrap = new Bootstrap("http://192.168.35.2");
    const myAddr = await localIpV4Address();
    const ipAddrs = await bootstrap.fetch();
    ipAddrs.filter(addr => addr !== myAddr).forEach(addr => {
        const client = new Client("ws://" + addr + ":43210");
        client.connect();
    })
})();
