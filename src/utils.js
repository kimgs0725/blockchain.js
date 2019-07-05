const log = message => {
    console.log((new Date().toISOString()) + '\t' + message);
};
module.exports = {
    log: log
};
