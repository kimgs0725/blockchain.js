module.exports = {
    log: (type, message) => {
        console.log((new Date().toISOString()) + '  ' + type + '\t' + message);
    },
    toHex: (number, length = 2) => {
        let hex = number.toString(16);
        if (hex.length < length) {
            for (let i = 0; i < length - hex.length; i++) {
                hex = "0" + hex;
            }
        }
        return hex;
    }
};
