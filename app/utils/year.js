'use strict';

const config = require('../../config/config');

module.exports = function (year) {
    const _year = +year;
    if (isNaN(_year)) {
        throw new Error('Invalid year');
    }
    const currentYear = (new Date).getFullYear();
    if (_year > currentYear || _year < config.minSupportedYear) {
        throw new Error('Year out of bounds');
    }
    return _year;
};