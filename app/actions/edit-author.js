'use strict';

module.exports = async (ctx) => {

    const authorId = (+(ctx.params.id || 0)) || 0;
    if (ctx.params.id && authorId < 1) {
        throw new Error('Invalid id');
    }

    const name = ctx.request.body.name;

    if (!name) {
        throw new Error('Name is not set');
    }
    const query = 'UPDATE `authors` SET `name` = ? WHERE `id` = ?';
    const params = [name, authorId];
    const result = await ctx.myPool().query(query, params);

    if (result.errno) {
        throw new Error(result.message);
    }

    ctx.body = {
        id: authorId,
        name: name
    }
};
