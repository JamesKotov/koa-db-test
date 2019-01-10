'use strict';

const md5 = require('../utils/md5');
const cache = require('../utils/cache');
const config = require('../../config/config');


module.exports = async (ctx) => {
    const defaultOnPage = config.defaultOnPage;
    const maxOnPage = config.maxOnPage;
    const allowedOrdering = ['id', 'title', 'year', 'image', 'description'];
    const allowedOrderingDirections = ['asc', 'desc'];

    const authorId = (+(ctx.params.id || 0)) || 0;
    if (ctx.params.id && authorId < 1) {
        throw new Error('Invalid id');
    }

    const authorsQuery = 'SELECT SQL_CALC_FOUND_ROWS * FROM `authors` WHERE `authors`.`id` = ? LIMIT 0, 1';

    let author;

    // try to get value from cache
    let key = md5([authorsQuery, authorId].join('_'));
    let cached = cache.get(key);
    if (cached) {
        author = cached;
    } else {
        const authorResult = await ctx.myPool().query(authorsQuery, [authorId]);
        if (authorResult.errno) {
            throw new Error(authorResult.message);
        }
        author = authorResult[0];
        cache.set(key, author);
    }
    if (!author) {
        throw new Error('Author not exists');
    }

    const createTmpTableQuery = 'CREATE TEMPORARY TABLE IF NOT EXISTS `author-books` (id INT NOT NULL PRIMARY KEY) ENGINE=MEMORY';

    const fillTmpTableQuery = 'INSERT INTO `author-books` (`id`) SELECT `book_id` FROM `authors-to-books` WHERE `author_id` = ?';

    let booksQuery = 'SELECT SQL_CALC_FOUND_ROWS ' +
        '`books`.`id`, `books`.`title`, `books`.`year`, `books`.`description`, `books`.`image`, ' +
        'GROUP_CONCAT(`authors-to-books`.`author_id` SEPARATOR \'|\') AS `authors` ' +
        'FROM `books`' +
        'INNER JOIN `author-books` ON `books`.`id` = `author-books`.`id` ' +
        'INNER JOIN `authors-to-books` ON `books`.`id` = `authors-to-books`.`book_id`'
    ;
    const booksParams = [];

    // grouping records by book
    booksQuery += ' GROUP BY `books`.`id` ';

    // Always set default ordering, because if none ordering set,
    // then db engine does not guarantee the same order of items while paging
    const order = (ctx.query.order || allowedOrdering[0]).toLowerCase();
    if (!~allowedOrdering.indexOf(order)) {
        throw new Error('Invalid order field');
    }
    let direction = (ctx.query.direction || allowedOrderingDirections[0]).toLowerCase();
    if (!~allowedOrderingDirections.indexOf(direction)) {
        throw new Error('Invalid direction');
    }
    // There is no substitutions params available,
    // because substituted params will be a "string" while these they MUST be an SQL Operartors.
    // This record is safe, because values of order snd direction filtered
    // thorough allowedOrdering and allowedOrderingDirections arrays.
    booksQuery += ` ORDER BY \`books\`.\`${order}\` ${direction} `;

    // limiting results
    // current page
    const page = (+ctx.query.page || 1) - 1;
    if (page < 0) {
        throw new Error('Invalid page');
    }

    // items on page
    let onPage = +(ctx.query.onPage) || defaultOnPage;
    if (onPage <= 0 || onPage > maxOnPage) {
        throw new Error('Invalid onPage value');
    }

    const offset = (page * onPage).toFixed();
    const limit = onPage;

    booksQuery += ' LIMIT ?, ? ';
    booksParams.push(offset);
    booksParams.push(limit);

    // try to get value from cache
    key = md5([booksQuery, authorId, JSON.stringify(booksParams)].join('_'));
    cached = cache.get(key);
    if (cached) {
        ctx.body = cached;
        return;
    }

    // doing queries
    let queryResult = await ctx.myPool().query(createTmpTableQuery, []);
    if (queryResult.errno) {
        throw new Error(queryResult.message);
    }

    queryResult = await ctx.myPool().query(fillTmpTableQuery, [authorId]);
    if (queryResult.errno) {
        throw new Error(queryResult.message);
    }

    const result = await ctx.myPool().query(booksQuery, booksParams);
    if (result.errno) {
        throw new Error(result.message);
    }

    if (result) {
        result.forEach((item) => item.authors = item.authors.split('|').map(Number));

        const counterResult = await ctx.myPool().query('SELECT FOUND_ROWS() as count', []);
        if (counterResult.errno) {
            throw new Error(counterResult.message);
        }

        const total = counterResult[0].count;
        const pages = Math.ceil(total / limit);

        const response = {
            page: (offset / limit)  + 1,
            onPage: limit,
            total: total,
            pages: pages,
            author: author,
            books: result
        };

        cache.set(key, response);

        ctx.body = response
    }
};