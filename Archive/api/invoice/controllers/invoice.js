'use strict';

/**
 * invoice controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::invoice.invoice', ({ strapi }) => ({
    async find(ctx){
        ctx.query.fields = [
            'invoice_id',
            'date',
            'total_quantity',
            'total_price'
        ]

        ctx.query.populate = {
            supplier: {
                fields: ['supplier_id', 'name']
            }
        }
        ctx.query.filters = {}
        if(!(ctx.query.supplier === undefined || ctx.query.supplier === null || ctx.query.supplier === '')) {
            ctx.query.filters.supplier = {id: parseInt(ctx.query.supplier)}
        }
        if(!(ctx.query.date === undefined || ctx.query.date === null || ctx.query.date === '')) {
            ctx.query.filters.date = ctx.query.date
        }
        if(!(ctx.query.invoice_id === undefined || ctx.query.invoice_id === null || ctx.query.invoice_id === '')) {
            ctx.query.filters.invoice_id = {$contains: ctx.query.invoice_id}
        }

        var { data, meta } = await super.find(ctx);

        // some more logic

        return { data, meta }
    },
    async findOne(ctx){
        ctx.query.fields = [
            'invoice_id',
            'date',
            'invoice_address',
            'delivery_address',
            'total_quantity',
            'total_price',
            'lowest_price',
            'selling_price'
        ]
        ctx.query.populate = {
            supplier: {
                fields: ['supplier_id', 'name']
            },
            storehouse: {
                fields: ['name']
            },
            restocks: {
                populate: {
                    product: {
                        fields: ['product_id', 'name']
                    },
                    variations: true
                }
            }
        }
        ctx.query.filters = {
            id: ctx.params.id,
        }

        var { data, meta } = await super.find(ctx);
        data = data[0]

        // some more logic

        return { data, meta }
    },
    async create(ctx){
        let {
            invoice_id,
            date,
            supplier,
            invoice_address,
            delivery_address,
            storehouse,
            restocks, // {product, variations: {variation, quantity}, unit_price, discount, net_price, total_amount, lowest_price, selling_price}
        } = ctx.request.body;

        var total_quantity = 0
        var total_price = 0.00
        for(var eachRestocks of restocks){
            var getProduct = await strapi.db.query('api::product.product').findOne({
                where: {
                    id: eachRestocks.product
                }
            })

            var total_quantity_of_variable = 0
            var restock_distribute = []
            for(var eachVariations of eachRestocks.variations){
                restock_distribute.push({
                    storehouse: storehouse,
                    quantity: eachVariations.quantity,
                    variation: eachVariations.variation
                })
                total_quantity_of_variable += eachVariations.quantity
            }

            var inputRestock = {
                restock_date: date,
                quantity: total_quantity_of_variable,
                restock_price: eachRestocks.net_price,
                // lowest_price: getProduct.new_lowest_price,
                // selling_price: getProduct.new_selling_price,
                restock_distribute: restock_distribute,
                product: getProduct.id,
                supplier: supplier
            }

            if(!(eachRestocks.lowest_price === undefined || eachRestocks.lowest_price === null)){
                inputRestock.lowest_price = eachRestocks.lowest_price
            } else {
                inputRestock.lowest_price = getProduct.new_lowest_price
            }

            if(!(eachRestocks.selling_price === undefined || eachRestocks.selling_price === null)){
                inputRestock.selling_price = eachRestocks.selling_price
            } else {
                inputRestock.selling_price = getProduct.new_selling_price
            }

            var restockResult = await strapi.service('api::restock.restock').createRestock(inputRestock)

            eachRestocks.restock = restockResult.restock_id
            total_quantity += total_quantity_of_variable
            total_price += eachRestocks.total_amount
        }
        var input = {
            invoice_id: invoice_id,
            date: date,
            supplier: supplier,
            storehouse: storehouse,
            invoice_address: invoice_address,
            delivery_address: delivery_address,
            restocks: restocks,
            total_quantity: total_quantity,
            total_price: total_price,
        }

        var result = await strapi.service('api::invoice.invoice').create({ data: input })

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
    }
}));
