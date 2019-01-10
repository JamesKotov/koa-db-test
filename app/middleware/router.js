'use strict';

const Router  = require('koa-router');
const convert = require('koa-convert');
const KoaBody = require('koa-body');

const getBooks = require('../actions/get-books');
const getAuthors = require('../actions/get-authors');
const getBooksByAuthor = require('../actions/get-books-by-author');

const addAuthor = require('../actions/add-author');
const addBook = require('../actions/add-book');

const editAuthor = require('../actions/edit-author');
const editBook = require('../actions/edit-book');

const router = new Router();
const koaBody = convert(KoaBody());

router
    .get('/books/:id', async (ctx) => {
        await getBooks(ctx);
    })
    .get('/books/year/:year', async (ctx) => {
        await getBooks(ctx);
    })
    .get('/books/author/:id', async (ctx) => {
        await getBooksByAuthor(ctx);
    })
    .get('/books', async (ctx) => {
        await getBooks(ctx);
    })
    .post('/books', koaBody, async (ctx) => {
        await addBook(ctx);
    })
    .put('/books/:id', koaBody, async (ctx) => {
        await editBook(ctx);
    })

    .get('/authors/search/:fragment', async (ctx) => {
        await getAuthors(ctx);
    })
    .get('/authors/:id', async (ctx) => {
        await getAuthors(ctx);
    })
    .get('/authors', async (ctx) => {
        await getAuthors(ctx);
    })
    .post('/authors', koaBody, async (ctx) => {
        await addAuthor(ctx);
    })
    .put('/authors/:id', koaBody, async (ctx) => {
        await editAuthor(ctx);
    });

module.exports.routes = function () { return router.routes() };
module.exports.allowedMethods = function () { return router.allowedMethods() };
