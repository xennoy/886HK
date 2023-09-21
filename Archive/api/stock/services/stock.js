'use strict';

/**
 * stock service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::stock.stock', ({ strapi }) => ({
    async createStock(product_id, storehouse_id){
        var findVariation = await strapi.db.query('api::variation.variation').findMany({
            where: {
                product: product_id
            }
        })

        var stock_list = []
        for(var eachVariation of findVariation){
            var input = {
                product: parseInt(product_id),
                storehouse: parseInt(storehouse_id),
                quantity: 0,
                variation: eachVariation.id
            }
            var result = await strapi.service('api::stock.stock').create({ data: input });
            stock_list.push(result)
        }

        return stock_list
    },
    async addStockVariation(product_id, variation_id){
        var findStorehouse = await strapi.db.query('api::storehouse.storehouse').findMany()

        var stock_list = []
        for(var eachStorehouse of findStorehouse){
            var input = {
                product: parseInt(product_id),
                storehouse: parseInt(eachStorehouse.id),
                quantity: 0,
                variation: variation_id
            }
            // console.log(input)
            var result = await strapi.service('api::stock.stock').create({ data: input });
            stock_list.push(result)
        }

        return stock_list
    }
}));
