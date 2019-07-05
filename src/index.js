const Bootstrap = require("./Bootstrap");
const Server = require("./Server");
const Client = require("./Client");

const server = new Server();
server.start();

(async () => {
    const bootstrap = new Bootstrap("http://192.168.35.217:3000");
    const ips = await bootstrap.fetch();
    ips.forEach(ip => {
        const client = new Client("ws://" + ip);
        client.connect();
    })
})();
