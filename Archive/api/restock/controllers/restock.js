'use strict';

/**
 * restock controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::restock.restock', ({ strapi }) => ({
    async create(ctx){
        let {
            restock_date,
            restock_price,
            lowest_price,
            selling_price,
            restock_distribute,
            product,
            supplier
        } = ctx.request.body;

        // console.log(ctx.request.body)
        
        if(
            product === undefined || product === null || product === "" ||
            supplier === undefined || supplier === null || supplier === "" ||
            restock_price === undefined || restock_price === null || restock_price === "" ||
            lowest_price === undefined || lowest_price === null || lowest_price === "" ||
            selling_price === undefined || selling_price === null || selling_price === "" ||
            restock_date === undefined || restock_date === null || restock_date === "" ||
            restock_distribute.length === 0
        ){
            var returner = {
                "status": 610,
                "message": "Something missing in your input!"
            }
            ctx.response.status = returner.status
            return returner
        }
        // console.log("check 1")

        var checkQuantity = 0
        for(var eachDistribute of restock_distribute){
            checkQuantity += parseInt(eachDistribute.quantity)
        }
        console.log(checkQuantity)
        if(lowest_price > selling_price){
            // console.log("error 1")
            var returner = {
                "status": 606,
                "message": "Your lowest_price is larger than selling_price!"
            }
            ctx.response.status = returner.status
            return returner
        }
        // console.log("check 2")

        var input = {
            restock_date: restock_date,
            quantity: checkQuantity,
            restock_price: restock_price,
            lowest_price: lowest_price,
            selling_price: selling_price,
            restock_distribute: restock_distribute,
            product: product,
            supplier: supplier
        }
        // console.log("check 3")

        var updatedStockList = []
        for(var eachDistribute of restock_distribute){
            var findStock = await strapi.db.query('api::stock.stock').findOne({ 
                where: {
                    product: product,
                    variation: eachDistribute.variation,
                    storehouse: eachDistribute.storehouse
                }
            })

            var updateStock = {
                id: findStock.id,
                quantity: findStock.quantity + eachDistribute.quantity,
            }
            updatedStockList.push(updateStock)
        }
        // console.log("check 4")


        var findProduct = await strapi.db.query('api::product.product').findOne({ 
            where: {
                id: product,
            },
            populate: {
                restocks: true
            }
        })
        // console.log("check 5")

        var average_restock_price
        var totalRestockPrice = parseFloat(restock_price)
        var restockCount = 1
        // console.log(totalRestockPrice)
        for(var eachRestock of findProduct.restocks){
            totalRestockPrice += parseFloat(eachRestock.restock_price)
            restockCount ++
            // console.log(totalRestockPrice)
        }
        average_restock_price = (totalRestockPrice / restockCount).toFixed(2)
        // console.log(average_restock_price)
        // console.log("check 6")


        var updateProduct = {
            new_restock_date: restock_date,
            new_lowest_price: lowest_price,
            new_selling_price: selling_price,
            average_restock_price: average_restock_price,
            supplier: supplier
        }

        // console.log(input)
        var result = await strapi.service('api::restock.restock').create({ data: input });

        for(var eachUpdatedStock of updatedStockList){
            var findStock_id = eachUpdatedStock.id
            delete eachUpdatedStock.id
            // console.log(eachUpdatedStock)
            var updatedStock = await strapi.service('api::stock.stock').update( findStock_id, { data: eachUpdatedStock });
        }

        // console.log(updateProduct)
        var updatedProduct = await strapi.service('api::product.product').update( findProduct.id, { data: updateProduct });

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
