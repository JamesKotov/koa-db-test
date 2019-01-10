'use strict';

const checkYear = require('../utils/year');

module.exports = async (ctx) => {

    const bookId = (+(ctx.params.id || 0)) || 0;
    if (ctx.params.id && bookId < 1) {
        throw new Error('Invalid id');
    }

    const title = ctx.request.body.title;
    if (!title) {
        throw new Error('Title is not set');
    }

    const year = checkYear(ctx.request.body.year);

    const image = ctx.request.body.image;
    if (!image) {
        throw new Error('Image is not set');
    }

    const description = ctx.request.body.description;
    if (!description) {
        throw new Error('Description is not set');
    }

    let authors = ctx.request.body.authors;
    if (!authors.length) {
        throw new Error('Authors is not set');
    }

    /*
    // Sorry, koa2-mysql-wrapper does not support transactions by design
    // Transaction can't be started as prepared statement,
    // but this module implements prepared statements only.
    // TODO: change mysql wrapper library and enable transactions for adding a books
    let result = await ctx.myPool().query('START TRANSACTION', []);
    if (result.errno) {
        throw new Error(result.message);
    }
    */

    const query = 'UPDATE `books` SET `title` = ?, `year` = ?, `image` = ?, `description` = ? WHERE `id` = ?';
    const params = [title, year, image, description, bookId];
    let result = await ctx.myPool().query(query, params);
    if (result.errno) {
        // Transactions not supported yet
        // TODO: uncomment after adding transactions support
        // await ctx.myPool().query('ROLLBACK', []);
        throw new Error(result.message);
    }

    const deleteAuthorsQuery = 'DELETE FROM `authors-to-books` WHERE `book_id` = ?';
    result = await ctx.myPool().query(deleteAuthorsQuery, [bookId]);
    if (result.errno) {
        // Transactions not supported yet
        // TODO: uncomment after adding transactions support
        // await ctx.myPool().query('ROLLBACK', []);
        throw new Error(result.message);
    }
    for (let author of authors) {
        const query = 'INSERT INTO `authors-to-books` (`book_id`, `author_id`) VALUES (?, ?) ';
        const params = [bookId, author];
        const result = await ctx.myPool().query(query, params);
        if (result.errno) {
            // Transactions not supported yet
            // TODO: uncomment after adding transactions support
            // await ctx.myPool().query('ROLLBACK', []);
            throw new Error(result.message);
        }
    }

    /*
    // Transactions not supported yet
    // TODO: uncomment after adding transactions support
    result = await ctx.myPool().query('COMMIT', []);
    if (result.errno) {
        throw new Error(result.message);
    }
    */

    ctx.body = {
        id: bookId,
        title: title,
        year: year,
        image: image,
        description: description,
    };
};
