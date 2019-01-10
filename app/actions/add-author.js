'use strict';

module.exports = async (ctx) => {

    const name = ctx.request.body.name;

    if (!name) {
        throw new Error('Name is not set');
    }
    const query = 'INSERT INTO `authors` (`name`) VALUES (?) ';
    const params = [name];
    const result = await ctx.myPool().query(query, params);

    if (result.errno) {
        throw new Error(result.message);
    }

    ctx.body = {
        id: result.insertId,
        name: name
    }
};