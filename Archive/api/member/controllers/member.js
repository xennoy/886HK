'use strict';

/**
 * member controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::member.member', ({ strapi }) => ({
    async find(ctx){
        ctx.query.fields = [
            'name',
            'email',
            'phone_no',
            'sex',
            'birthdate',
            'member_id'
        ]
        ctx.query.populate = {
            member_level: true
        }

        ctx.query.filters = {}
        if(!(ctx.query.search === undefined || ctx.query.search === null || ctx.query.search === '')) {
            ctx.query.filters.$or = [
                {member_id: {$contains: ctx.query.search}},
                {name: {$contains: ctx.query.search}},
                {phone_no: {$contains: ctx.query.search}},
                {email: {$contains: ctx.query.search}},
            ]
        }

        const { data, meta } = await super.find(ctx);

        // some more logic

        return { data, meta };
    },
    async findOne(ctx){
        ctx.query.populate = {
            member_level: true
        }

        ctx.query.filters = {id: ctx.params.id}

        var { data, meta } = await super.find(ctx);
        data = data[0]

        // some more logic

        return { data, meta };
    },
    async create(ctx){
        let {
            name,
            email,
            phone_no,
            sex,
            birthdate,
            member_id,
            create_date,
            member_level,
            remarks,
            address
        } = ctx.request.body;
        var input = {
            name: name,
            email: email,
            phone_no: phone_no,
            sex: sex,
            birthdate: birthdate,
            member_id: member_id,
            create_date: create_date,
            member_level: member_level,
            remarks: remarks,
            address: address
        }
        var result = await strapi.service('api::member.member').create({ data: input });
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
            email,
            phone_no,
            sex,
            birthdate,
            member_id,
            create_date,
            member_level,
            remarks,
            address
        } = ctx.request.body;
        var input = {
            name: name,
            email: email,
            phone_no: phone_no,
            sex: sex,
            birthdate: birthdate,
            member_id: member_id,
            create_date: create_date,
            member_level: member_level,
            remarks: remarks,
            address: address
        }
        var result = await strapi.service('api::member.member').update( ctx.params.id, { data: input });
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
