'use strict';

const md5 = require('../utils/md5');
const cache = require('../utils/cache');
const config = require('../../config/config');


module.exports = async (ctx) => {
    const defaultOnPage = config.defaultOnPage;
    const maxOnPage = config.maxOnPage;
    const allowedOrdering = ['id', 'name'];
    const allowedOrderingDirections = ['asc', 'desc'];

    const params = [];
    let query = 'SELECT SQL_CALC_FOUND_ROWS * FROM `authors` ';

    let offset = 0;
    let limit = defaultOnPage;

    const authorId = (+(ctx.params.id || 0)) || 0;
    if (ctx.params.id && authorId < 1) {
        throw new Error('Invalid id');
    }
    if (authorId) {
        // getting one author
        query += ' WHERE `authors`.`id` = ? ';
        params.push(authorId);
        offset = 0;
        limit = 1;
    } else {
        // search by part of author name
        const fragment = ctx.params.fragment;
        if (fragment) {
            query += ' WHERE `authors`.`name` LIKE ? ';
            params.push(`%${fragment}%`);
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
    query += ` ORDER BY \`authors\`.\`${order}\` ${direction} `;

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
        authors: result
    };

    cache.set(key, response);

    ctx.body = response

};