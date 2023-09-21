'use strict';

/**
 * variation service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::variation.variation', ({ strapi }) => ({
    async createVariation(product_id, variation_name){
        var input = {
            name: variation_name,
            product: product_id
        }
        
        var result = await strapi.service('api::variation.variation').create({ data: input });
        return result
    }
}));
