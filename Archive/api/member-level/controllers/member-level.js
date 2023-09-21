'use strict';

/**
 * member-level controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::member-level.member-level', ({ strapi }) => ({
    async create(ctx){
        let {
            name,
            discount,
        } = ctx.request.body;
        var input = {
            name: name,
            discount: discount
        }
        var result = await strapi.service('api::member-level.member-level').create({ data: input });

        var returner
        if (!(result === null || result === undefined)) {
            returner = {
                "status": 200,
                "message": "Create successful"
            }
        } else {
            returner = {
                "status": 200,
                "message": "Nothing needs to be created"
            }
        }
        ctx.response.status = returner.status
        return returner
    },
    async update(ctx){
        let {
            name,
            discount,
        } = ctx.request.body;
        var input = {
            name: name,
            discount: discount
        }
        var result = await strapi.service('api::member-level.member-level').update( ctx.params.id, { data: input });

        var returner
        if (!(result === null || result === undefined)) {
            returner = {
                "status": 200,
                "message": "Update successful"
            }
        } else {
            returner = {
                "status": 200,
                "message": "Nothing needs to be updated"
            }
        }
        ctx.response.status = returner.status
        return returner
    },
}));
