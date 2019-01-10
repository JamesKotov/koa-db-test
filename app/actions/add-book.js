'use strict';

const checkYear = require('../utils/year');

module.exports = async (ctx) => {

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
    authors = authors.sort();

    // test, if book already exists?
    const testBookQuery = 'SELECT * FROM `books` WHERE `title` = ? AND `year` = ?';
    const testBookParams = [title, year];
    const testBookResult = await ctx.myPool().query(testBookQuery, testBookParams);
    if (testBookResult.errno) {
        throw new Error(testBookResult.message);
    }

    if (testBookResult.length) {
        for (let book of testBookResult) {

            let foundAuthors = [];
            const testBookAuthorsQuery = 'SELECT * FROM `authors-to-books` WHERE `book_id` = ?';

            const testBookAuthorsResult = await ctx.myPool().query(testBookAuthorsQuery, [book.id]);
            if (testBookAuthorsResult.errno) {
                throw new Error(testBookAuthorsResult.message);
            }

            testBookAuthorsResult.forEach((record) => foundAuthors.push(record.author_id));
            foundAuthors = foundAuthors.sort();

            if (authors.join('_') === foundAuthors.join('_')) {
                throw new Error('Book already exists. Use put query to update book data');
            }
        }
    }

    // adding a new book

    const query = 'INSERT INTO `books` (`title`, `year`, `image`, `description`) VALUES (?, ?, ?, ?)';
    const params = [title, year, image, description];

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

    let result = await ctx.myPool().query(query, params);

    if (result.errno) {
        // Transactions not supported yet
        // TODO: uncomment after adding transactions support
        // await ctx.myPool().query('ROLLBACK', []);
        throw new Error(result.message);
    }

    const bookId = result.insertId;

    const response = {
        id: bookId,
        title: title,
        year: year,
        image: image,
        description: description,
    };

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

    ctx.body = response;

};