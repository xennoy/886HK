'use strict';

/**
 * restock service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::restock.restock', ({ strapi }) => ({
    async createRestock(inputObject){
        // console.log('In createRestock')
        // console.log(inputObject)
        let {
            restock_date,
            restock_price,
            lowest_price,
            selling_price,
            restock_distribute,
            product,
            supplier
        } = inputObject;

        // console.log(ctx.request.body)
        
        if(
            product === undefined || product === null || product === "" ||
            // supplier === undefined || supplier === null || supplier === "" ||
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
            // ctx.response.status = returner.status
            return returner
        }
        // console.log("check 1")

        var findProduct = await strapi.db.query('api::product.product').findOne({ 
            where: {
                product_id: product
            },
            populate: {
                restocks: true
            }
        })
        if(findProduct === undefined || findProduct === null){
            var returner = {
                "status": 604,
                "message": "This product_id does not exist!"
            }
            // ctx.response.status = returner.status
            return returner
        }

        // console.log("check 2")

        var checkQuantity = 0
        for(var eachDistribute of restock_distribute){
            checkQuantity += parseInt(eachDistribute.quantity)
        }
        // console.log(checkQuantity)
        if(lowest_price > selling_price){
            // console.log("error 1")
            var returner = {
                "status": 606,
                "message": "Your lowest_price is larger than selling_price!"
            }
            // ctx.response.status = returner.status
            return returner
        }
        // console.log("check 3")

        var input = {
            restock_date: restock_date,
            quantity: checkQuantity,
            restock_price: restock_price,
            lowest_price: lowest_price,
            selling_price: selling_price,
            restock_distribute: restock_distribute,
            product: findProduct.id,
            // supplier: supplier
        }
        if(!(supplier === undefined || supplier === null || supplier === "")){
            input.supplier = supplier
        }
        // console.log("check 4")

        var updatedStockList = []
        for(var eachDistribute of restock_distribute){
            var findStock = await strapi.db.query('api::stock.stock').findOne({ 
                where: {
                    product: findProduct.id,
                    variation: eachDistribute.variation,
                    storehouse: eachDistribute.storehouse
                }
            })

            // console.log(findStock)
            var updateStock = {
                id: findStock.id,
                quantity: findStock.quantity + eachDistribute.quantity,
            }
            updatedStockList.push(updateStock)
        }
        // console.log("check 5")

        var average_restock_price
        var totalRestockPrice = parseFloat(parseFloat(restock_price).toFixed(2))
        var restockCount = 1
        // console.log(totalRestockPrice)
        for(var eachRestock of findProduct.restocks){
            totalRestockPrice += parseFloat(parseFloat(eachRestock.restock_price).toFixed(2))
            restockCount ++
            // console.log(totalRestockPrice)
        }
        average_restock_price = parseFloat((totalRestockPrice / restockCount).toFixed(2))
        // console.log(average_restock_price)
        // console.log("check 6")


        var updateProduct = {
            new_restock_date: restock_date,
            new_lowest_price: lowest_price,
            new_selling_price: selling_price,
            new_restock_price: restock_price,
            average_restock_price: average_restock_price,
            // supplier: supplier
        }
        if(!(supplier === undefined || supplier === null || supplier === "")){
            updateProduct.supplier = supplier
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

        // var returner
        // if (!(result === null || result === undefined)) {
        //     returner = {
        //         "status": 200,
        //         "message": "Create successful"
        //     }
        // } else {
        //     returner = {
        //         "status": 200,
        //         "message": "Nothing needs to be created"
        //     }
        // }
        // ctx.response.status = returner.status
        // return returner
        // console.log(result)
        var returner = {
            restock_id: result.id
        }
        return returner
    }
}));
