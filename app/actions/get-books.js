'use strict';

const md5 = require('../utils/md5');
const cache = require('../utils/cache');
const checkYear = require('../utils/year');
const config = require('../../config/config');


module.exports = async (ctx) => {
    const defaultOnPage = config.defaultOnPage;
    const maxOnPage = config.maxOnPage;
    const allowedOrdering = ['id', 'title', 'year', 'image', 'description'];
    const allowedOrderingDirections = ['asc', 'desc'];

    const params = [];
    let query = 'SELECT SQL_CALC_FOUND_ROWS ' +
        '`books`.`id`, `books`.`title`, `books`.`year`, `books`.`description`, `books`.`image`, ' +
        'GROUP_CONCAT(`authors-to-books`.`author_id` SEPARATOR \'|\') AS `authors` ' +
        'FROM `books`' +
        'INNER JOIN `authors-to-books` ON `books`.`id` = `authors-to-books`.`book_id`';

    let offset = 0;
    let limit = defaultOnPage;

    const bookId = (+(ctx.params.id || 0)) || 0;
    if (ctx.params.id && bookId < 1) {
        throw new Error('Invalid id');
    }
    if (bookId) {
        // getting one book
        query += ' WHERE `books`.`id` = ? ';
        params.push(bookId);
        offset = 0;
        limit = 1;
    } else {

        if (ctx.params.year) {
            const year = checkYear(ctx.params.year);
            query += ' WHERE `books`.`year` = ? ';
            params.push(year);
        }

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

        offset = (page * onPage).toFixed();
        limit = onPage;
    }

    // grouping records by book
    query += ' GROUP BY `books`.`id` ';

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
    // througth allowedOrdering and allowedOrderingDirections arrays.
    query += ` ORDER BY \`books\`.\`${order}\` ${direction} `;

    // limiting results
    query += ' LIMIT ?, ? ';
    params.push(offset);
    params.push(limit);

    // try to get value from cache
    const key = md5([query, JSON.stringify(params)].join('_'));
    const cached = cache.get(key);
    if (cached) {
        ctx.body = cached;
        return;
    }

    // doing queries
    const result = await ctx.myPool().query(query, params);
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
            books: result
        };

        cache.set(key, response);

        ctx.body = response
    }
};