const fetch = require("node-fetch");

class Bootstrap {
    constructor(url) {
        this.url = url;
    }

    fetch = async () => {
        const response = await fetch(this.url, {
            headers: {
                "Content-Type": "application/json"
            }
        });
        return await response.json();
    };
}

module.exports = Bootstrap;
