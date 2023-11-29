'use strict';

/**
 * restock controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::restock.restock', ({ strapi }) => ({
    async create(ctx){
        var createRestock = await strapi.service('api::restock.restock').createRestock(ctx.request.body)
        if(!(createRestock.restock_id === undefined || createRestock.restock_id === null)){
            var returner
            if (!(createRestock === null || createRestock === undefined)) {
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
        } else {
            ctx.response.status = createRestock.status
            return createRestock
        }
    }
}));
