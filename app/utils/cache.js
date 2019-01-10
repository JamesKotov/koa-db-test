'use strict';

const LRU = require("lru-cache");
const config = require('../../config/config');

const options = {
    max: config.cacheCapacity,
    maxAge: config.cacheTime
};
const cache = new LRU(options);

module.exports.get = function (key) {
    const result = cache.get(key);
    if (result) {
        return JSON.parse(result);
    }
    return result;

};
module.exports.set = function (key, value) {
    cache.set(key, JSON.stringify(value));
};