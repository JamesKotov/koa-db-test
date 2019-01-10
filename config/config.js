module.exports = {

    serverPort: 3000,

    dbHost: 'localhost',
    dbName: 'koa-test',
    dbUser: 'koa-test',
    dbPass: 'koa-test',

    cacheTime: 1000 * 60 * 5, // 5 minutes
    cacheCapacity: 1000, // max items in cache

    minSupportedYear: 1900,

    defaultOnPage: 25,
    maxOnPage: 100
};