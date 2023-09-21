'use strict';

/**
 * variation controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::variation.variation', ({ strapi }) => ({
    async create(ctx){
        let {
            name,
            product,
        } = ctx.request.body;

        if(name === undefined || name === null || name === "" || product === undefined || product === null || product === ""){
            var returner = {
                "status": 610,
                "message": "Something is missing in your input"
            }
            ctx.response.status = returner.status
            return returner
        }
        var result = await strapi.service('api::variation.variation').createVariation(product, name);

        // console.log(result)
        var addStockVariation = await strapi.service('api::stock.stock').addStockVariation(product, result.id);

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
        // console.log(ctx.request.body)
        let {
            name,
        } = ctx.request.body;
        var input = {
            name: name,
        }

        // console.log(input)
        var result = await strapi.service('api::variation.variation').update(ctx.params.id, { data: input });
        // console.log(result)

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
    }
}));
