const config = {

    serverPort: process.env.SERVER_PORT || 3000,

    dbHost: process.env.DB_HOST || 'localhost',
    dbName: process.env.DB_NAME || 'koa-test',
    dbUser: process.env.DB_USER || 'koa-test',
    dbPass: process.env.DB_PASS || 'koa-test',

    cacheTime: +(process.env.CACHE_TIME || 1000 * 60 * 5), // 5 minutes
    cacheCapacity: +(process.env.CACHE_CAPACITY || 1000), // max items in cache

    minSupportedYear: +(process.env.MIN_SUPPORTED_YEAR || 1900),

    defaultOnPage: +(process.env.DEFAULT_ON_PAGE || 25),
    maxOnPage: +(process.env.MAX_ON_PAGE || 100)
};

if (config.defaultOnPage > config.maxOnPage) {
    config.defaultOnPage = config.maxOnPage
}

module.exports = config;