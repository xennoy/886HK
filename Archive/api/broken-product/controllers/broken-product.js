'use strict';

const { setDate } = require('date-fns');

/**
 * broken-product controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::broken-product.broken-product', ({ strapi }) => ({
    async find(ctx){
        ctx.query.fields = [
            'quantity',
            'date',
            'remarks'
        ]

        ctx.query.populate = {
            product: true,
            storehouse: true
        }

        ctx.query.filters = {}
        if(!(ctx.query.storehouse === undefined || ctx.query.storehouse === null || ctx.query.storehouse === '')) {
            ctx.query.filters.storehouse = {id: parseInt(ctx.query.storehouse)}
        }
        if(!(ctx.query.date === undefined || ctx.query.date === null || ctx.query.date === '')) {
            var currentDate = new Date(ctx.query.date)
            currentDate.setDate(currentDate.getDate() + 1)
            let day = ("0" + currentDate.getDate()).slice(-2);
            let month = ("0" + (currentDate.getMonth() + 1)).slice(-2);
            let year = currentDate.getFullYear();
            var endDate = year + '-' + month + '-' + day

            ctx.query.filters.date = {
                $gte: ctx.query.date,
                $lt: endDate
            }
        }
        if(!(ctx.query.product === undefined || ctx.query.product === null || ctx.query.product === '')) {
            ctx.query.filters.product = {id: parseInt(ctx.query.product)}
        }
        // if(!(ctx.query.product === undefined || ctx.query.product === null || ctx.query.product === '')) {
        //     ctx.query.filters.$or = [
        //         {product: {product_id: {$contains: ctx.query.search}}},
        //         {product: {name: {$contains: ctx.query.search}}},
        //     ]
        // }

        var { data, meta } = await super.find(ctx);

        for(var eachData of data){
            // console.log(eachData)
            if(!(eachData.attributes.storehouse.data === undefined || eachData.attributes.storehouse.data === null)){
                // console.log(eachData.attributes.storehouse)
                eachData.attributes.storehouse_name = eachData.attributes.storehouse.data.attributes.name
                delete eachData.attributes.storehouse
            }
            if(!(eachData.attributes.product.data === undefined || eachData.attributes.product.data === null)){
                // console.log(eachData.attributes.product)
                eachData.attributes.product_name = eachData.attributes.product.data.attributes.name
                eachData.attributes.product_id = eachData.attributes.product.data.attributes.product_id
                delete eachData.attributes.product
            }
        }

        // console.log(data)

        // some more logic

        return { data, meta };
    },
    async findOne(ctx){
        ctx.query.fields = [
            'quantity',
            'date',
            'remarks'
        ]

        ctx.query.populate = {
            product: {
                fields: [
                    'product_id',
                    'name',
                    'new_restock_date'
                ],
                populate: {
                    stocks: true,
                    restocks: {
                        // sort: ['restock_date:desc'],
                        populate: {
                            supplier: {
                                fields: [
                                    'name'
                                ]
                            }
                        }
                    },
                    variation: true
                }
            },
            storehouse: true
        }

        ctx.query.filters = {id: ctx.params.id}

        var { data, meta } = await super.find(ctx);
        data = data[0]

        // console.log(data)
        if(data.attributes.storehouse !== undefined){
            data.attributes.storehouse_id = data.attributes.storehouse.data.id
            data.attributes.storehouse_name = data.attributes.storehouse.data.attributes.name
            delete data.attributes.storehouse
        }
        if(data.attributes.product !== undefined){
            data.attributes.product_name = data.attributes.product.data.attributes.name
            data.attributes.product_id = data.attributes.product.data.attributes.product_id


            // console.log(data.attributes.product.data.attributes)

            data.attributes.product.data.attributes.new_restock_price = 0
            data.attributes.product.data.attributes.new_supplier = null

            // console.log(data.attributes.product.data.attributes.restocks)
            if(data.attributes.product.data.attributes.restocks.data.length > 0){
                var newRestock = data.attributes.product.data.attributes.restocks[0]
                // console.log(newRestock)

                data.attributes.product.data.attributes.new_restock_price = newRestock.restock_price
                data.attributes.product.data.attributes.new_supplier = newRestock.supplier.name
            }
            delete data.attributes.product.data.attributes.restocks

            // console.log(data.attributes.product.data.attributes)
            // console.log(data.attributes.product.data.attributes.stocks)

            data.attributes.product.data.attributes.total_stock = 0
            for(var eachStock of data.attributes.product.data.attributes.stocks.data){
                data.attributes.product.data.attributes.total_stock += eachStock.attributes.quantity
            }
            delete data.attributes.product.data.attributes.stocks
        }

        // some more logic

        return { data, meta };
    },

    async create(ctx){
        // console.log(ctx.request.body)
        let {
            product_id,
            quantity,
            storehouse_id,
            date,
            remarks,
            variation
        } = ctx.request.body;

        if(
            product_id === undefined || product_id === null || product_id === "" ||
            quantity === undefined || quantity === null || quantity === "" ||
            storehouse_id === undefined || storehouse_id === null || storehouse_id === "" ||
            variation === undefined || variation === null || variation === "" ||
            date === undefined || date === null || date === ""
            
        ){
            var returner = {
                "status": 610,
                "message": "Something missing in your input!"
            }
            ctx.response.status = returner.status
            return returner
        }

        var input = {
            product: product_id,
            quantity: quantity,
            storehouse: storehouse_id,
            date: date,
            remarks: remarks,
            variation: variation
        }

        var findStock = await strapi.db.query('api::stock.stock').findOne({ 
            where: {
                product: product_id,
                variation: variation,
                storehouse: storehouse_id
            }
        })

        findStock.quantity -= quantity
        if(findStock.quantity < 0){
            var returner = {
                "status": 606,
                "message": "The storehouse does not have this much product to be broken!"
            }
            ctx.response.status = returner.status
            return returner
        }

        var change = {
            quantity: findStock.quantity,
        }

        var result = await strapi.service('api::broken-product.broken-product').create({ data: input });

        var updateStock = await strapi.service('api::stock.stock').update( findStock.id, { data: change });

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

    async delete(ctx){
        var findBrokenProduct = await strapi.db.query('api::broken-product.broken-product').findOne({ 
            where: {
                id: ctx.params.id
            },
            populate: {
                product: true,
                storehouse: true,
                variation: true
            }
        })

        var findStock = await strapi.db.query('api::stock.stock').findOne({
            where: {
                product: findBrokenProduct.product,
                storehouse: findBrokenProduct.storehouse,
                variation: findBrokenProduct.variation
            }
        })

        var change = {
            quantity: findStock.quantity + findBrokenProduct.quantity,
        }

        var updateStock = await strapi.service('api::stock.stock').update( findStock.id, { data: change });

        var result = await super.delete(ctx);

        var returner
        if (!(result === null || result === undefined)) {
            returner = {
                "status": 200,
                "message": "Delete successful"
            }
        } else {
            returner = {
                "status": 200,
                "message": "Nothing needs to be deleted"
            }
        }
        ctx.response.status = returner.status
        return returner
    }
}));
