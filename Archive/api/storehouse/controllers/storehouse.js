'use strict';

/**
 * storehouse controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::storehouse.storehouse', ({ strapi }) => ({
    async create(ctx){
        let {
            name,
            contact_person,
            phone_no,
            address,
            facebook,
            remarks
        } = ctx.request.body;
        var input = {
            name: name,
            contact_person: contact_person,
            phone_no: phone_no,
            address: address,
            facebook: facebook,
            remarks: remarks
        }
        var result = await strapi.service('api::storehouse.storehouse').create({ data: input });

        var findProduct = await strapi.db.query('api::product.product').findMany()
        for(var eachProduct of findProduct){
            var createStock = await strapi.service('api::stock.stock').createStock(eachProduct.id, result.id)
        }

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
    async update(ctx){
        let {
            name,
            contact_person,
            phone_no,
            address,
            facebook,
            remarks
        } = ctx.request.body;
        var input = {
            name: name,
            contact_person: contact_person,
            phone_no: phone_no,
            address: address,
            facebook: facebook,
            remarks: remarks
        }
        var result = await strapi.service('api::storehouse.storehouse').update( ctx.params.id, { data: input });
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
