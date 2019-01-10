'use strict';

const Koa = require('koa');
const mysql = require('koa2-mysql-wrapper');
const err = require('./middleware/errors');
const logger = require('./middleware/logger');
const router = require('./middleware/router');
const config = require('../config/config');


const app = new Koa();

// common errors handler
app.use(err);

// logger
app.use(logger);

// init db connection
app.use(mysql({host: config.dbHost, user: config.dbUser, password: config.dbPass, database: config.dbName}));

app.use(router.routes());
app.use(router.allowedMethods());

const port = config.serverPort;

// server
const server = app.listen(port, () => {
    console.log(`Server listening on port: ${port}`);
});

module.exports = server;
