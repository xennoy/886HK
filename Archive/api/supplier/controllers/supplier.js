'use strict';

/**
 * supplier controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::supplier.supplier', ({ strapi }) => ({
    async find(ctx){
        ctx.query.fields = [
            'supplier_id',
            'name',
            'phone_no',
            'email',
            'contact_person',
            'create_date',
        ]

        ctx.query.filters = {}
        if(!(ctx.query.search === undefined || ctx.query.search === null || ctx.query.search === '')) {
            ctx.query.filters.$or = [
                {supplier_id: {$contains: ctx.query.search}},
                {name: {$contains: ctx.query.search}},
                {phone_no: {$contains: ctx.query.search}},
                {email: {$contains: ctx.query.search}},
                {contact_person: {$contains: ctx.query.search}},
            ]
        }

        const { data, meta } = await super.find(ctx);

        // some more logic

        return { data, meta };
    },
    async create(ctx){
        let {
            supplier_id,
            name,
            phone_no,
            email,
            contact_person,
            create_date,
            office_address,
            factory_address,
            remarks,
        } = ctx.request.body;
        var input = {
            supplier_id: supplier_id,
            name: name,
            phone_no: phone_no,
            email: email,
            contact_person: contact_person,
            create_date: create_date,
            office_address: office_address,
            factory_address: factory_address,
            remarks: remarks,
        }
        var result = await strapi.service('api::supplier.supplier').create({ data: input });
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
            supplier_id,
            name,
            phone_no,
            email,
            contact_person,
            create_date,
            office_address,
            factory_address,
            remarks,
        } = ctx.request.body;
        var input = {
            supplier_id: supplier_id,
            name: name,
            phone_no: phone_no,
            email: email,
            contact_person: contact_person,
            create_date: create_date,
            office_address: office_address,
            factory_address: factory_address,
            remarks: remarks,
        }
        var result = await strapi.service('api::supplier.supplier').update( ctx.params.id, { data: input });
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
