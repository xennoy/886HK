'use strict';

/**
 * label controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::label.label', ({ strapi }) => ({
    async find(ctx){
        ctx.query.fields = [
            'name',
            'isShow',
        ]

        const { data, meta } = await super.find(ctx);

        // some more logic

        return { data, meta };
    },
    async findOne(ctx){
        ctx.query.fields = [
            'name',
            'isShow',
        ]

        ctx.query.populate = {
            products: {
                fields: [
                    'product_id',
                    'name'
                ]
            }
        }

        ctx.query.filters = {id: ctx.params.id}

        // console.log(ctx.query)

        var { data, meta } = await super.find(ctx);
        data = data[0]

        // console.log(data)

        // some more logic

        return { data, meta };
    },
    async create(ctx){
        let {
            name,
            isShow,
        } = ctx.request.body;
        var input = {
            name: name,
            isShow: isShow
        }
        var result = await strapi.service('api::label.label').create({ data: input });
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
            isShow,
        } = ctx.request.body;
        var input = {
            name: name,
            isShow: isShow
        }
        var result = await strapi.service('api::label.label').update( ctx.params.id, { data: input });
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
}));
