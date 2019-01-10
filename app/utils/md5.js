'use strict';

const crypto = require('crypto');

module.exports = function (key) {
    return crypto.createHash('md5').update(key).digest("hex");
};