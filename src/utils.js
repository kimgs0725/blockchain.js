const log = (type, message) => {
    console.log((new Date().toISOString()) + '  ' + type +  '\t' + message);
};
module.exports = {
    log: log
};
