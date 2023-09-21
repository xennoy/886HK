'use strict';

const { default: isThisQuarter } = require('date-fns/isThisQuarter');

/**
 * product controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::product.product', ({ strapi }) => ({
    async find(ctx){
        ctx.query.fields = [
            'product_id',
            'name',
            'new_restock_date',
            'average_restock_price'
        ]

        ctx.query.populate = {
            stocks: true,
            restocks: true,
            supplier: true,
            variations: true
        }

        ctx.query.filters = {}
        if(!(ctx.query.label === undefined || ctx.query.label === null || ctx.query.label === '')) {
            ctx.query.filters.labels = {id: parseInt(ctx.query.label)}
        }
        if(!(ctx.query.supplier === undefined || ctx.query.supplier === null || ctx.query.supplier === '')) {
            ctx.query.filters.supplier = {id: parseInt(ctx.query.supplier)}
        }
        if(!(ctx.query.new_restock_date === undefined || ctx.query.new_restock_date === null || ctx.query.new_restock_date === '')) {
            var currentDate = new Date(ctx.query.new_restock_date)
            currentDate.setDate(currentDate.getDate() + 1)
            let day = ("0" + currentDate.getDate()).slice(-2);
            let month = ("0" + (currentDate.getMonth() + 1)).slice(-2);
            let year = currentDate.getFullYear();
            var endDate = year + '-' + month + '-' + day
            ctx.query.filters.new_restock_date = {
                $gte: ctx.query.new_restock_date,
                $lt: endDate
            }
        }
        if(!(ctx.query.search === undefined || ctx.query.search === null || ctx.query.search === '')) {
            ctx.query.filters.$or = [
                {product_id: {$contains: ctx.query.search}},
                {name: {$contains: ctx.query.search}},
            ]
        }

        // console.log(ctx.query)

        var { data, meta } = await super.find(ctx);

        // console.log(data.restocks)
        // console.log(data)

        for(var eachData of data){
            // console.log(eachData.attributes)

            eachData.attributes.new_restock_price = 0
            eachData.attributes.new_supplier = eachData.attributes.supplier.name
            delete eachData.attributes.supplier

            // console.log(eachData.attributes.restocks)
            if(eachData.attributes.restocks.data.length > 0){
                var newRestock = eachData.attributes.restocks.data[0]
                // console.log(newRestock)

                eachData.attributes.new_restock_price = newRestock.attributes.restock_price
            }
            delete eachData.attributes.restocks

            // console.log(eachData.attributes)
            // console.log(eachData.attributes.stocks)
    
            eachData.attributes.total_stock = 0
            for(var eachStock of eachData.attributes.stocks.data){
                eachData.attributes.total_stock += eachStock.attributes.quantity
            }
            delete eachData.attributes.stocks
        }

        // some more logic

        return { data, meta };
    },
    async findOne(ctx){
        ctx.query.fields = [
            'product_id',
            'name',
            'create_date',
            'new_restock_date',
            'new_lowest_price',
            'new_selling_price',
            'average_restock_price'
        ]

        ctx.query.populate = {
            labels: true,
            remarks: true,
            stocks: {
                populate: {
                    storehouse: true,
                    variation: true
                }
            },
            restocks: {
                sort: ['restock_date:desc'],
                populate: {
                    supplier: {
                        fields: [
                            'name'
                        ]
                    },
                    restock_distribute: {
                        populate: {
                            storehouse: true,
                            variation: true
                        }
                    }
                }
            },
            broken_products: {
                populate: {
                    storehouse: true,
                    variation: true,
                }
            },
            variations: true
        }

        ctx.query.filters = {id: ctx.params.id}

        var { data, meta } = await super.find(ctx);
        data = data[0]

        data.attributes.new_restock_price = 0
        if(data.attributes.restocks.data.length > 0){
            var newRestock = data.attributes.restocks.data[0]
            data.attributes.new_restock_price = newRestock.attributes.restock_price
            data.attributes.new_restock_id = newRestock.id
        }

        // data.attributes.total_stock = 0
        var storehouse_info = []
        // console.log(data.attributes.stocks.data)
        for(var eachStock of data.attributes.stocks.data){
            // data.attributes.total_stock += eachStock.attributes.quantity
            // console.log(eachStock.attributes.storehouse)
            var isFound = false

            var pushVariation = {
                id: eachStock.attributes.variation.data.id,
                name: eachStock.attributes.variation.data.attributes.name,
                quantity: eachStock.attributes.quantity,
            }

            // console.log(pushVariation)

            // console.log(eachStock.attributes.storehouse.data.id)
            // console.log(" ")

            for(var eachStockInfo of storehouse_info){
                // console.log(eachStockInfo.storehouse_id)
                if(eachStockInfo.storehouse_id === eachStock.attributes.storehouse.data.id){
                    eachStockInfo.variation.push(pushVariation)
                    isFound = true
                    break
                }
            }

            if(!isFound){
                var one_storehouse_info = {
                    storehouse_id: eachStock.attributes.storehouse.data.id,
                    storehouse_name: eachStock.attributes.storehouse.data.attributes.name,
                    // quantity: eachStock.attributes.quantity,
                    phone_no: eachStock.attributes.storehouse.data.attributes.phone_no,
                    storehouse_address: eachStock.attributes.storehouse.data.attributes.address,
                    variation: [pushVariation]
                }
                storehouse_info.push(one_storehouse_info)
            }
        }
        // console.log(storehouse_info)
        // console.log(storehouse_info[0].variation)
        data.attributes.storehouse_info = storehouse_info
        delete data.attributes.stocks

        data.attributes.total_broken_products = 0
        for(var eachBrokenProduct of data.attributes.broken_products.data){
            var today = new Date()
            var year = today.getFullYear()
            var month = ("0" + (today.getMonth() + 1)).slice(-2);
            var firstDay = year + "-" + month + "-01"
            var firstDayDateType = new Date(firstDay)
            var targetDayDateType = new Date(eachBrokenProduct.attributes.date)
            if(targetDayDateType >= firstDayDateType){
                data.attributes.total_broken_products += eachBrokenProduct.attributes.quantity
            }
            
        }
        // delete data.attributes.broken_products      

        // some more logic

        return { data, meta };
    },
    async create(ctx){
        let {
            product_id,
            name,
            create_date,
            remarks,
            labels,
        } = ctx.request.body;
        var input = {
            product_id: product_id,
            name: name,
            create_date: create_date,
            remarks: remarks,
            labels: labels
        }
        var result = await strapi.service('api::product.product').create({ data: input });

        var createVariation = await strapi.service('api::variation.variation').createVariation(result.id, 'Original');

        var findStorehouse = await strapi.db.query('api::storehouse.storehouse').findMany()
        for(var eachStorehouse of findStorehouse){
            var createStock = await strapi.service('api::stock.stock').createStock(result.id, eachStorehouse.id)
        }

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

        return result
    },
    async update(ctx){
        let {
            name,
            remarks,
        } = ctx.request.body;
        var input = {
            name: name,
            remarks: remarks
        }
        var result = await strapi.service('api::product.product').update( ctx.params.id, { data: input });

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

    async addLabel(ctx){
        var findProduct = await strapi.db.query('api::product.product').findOne({
            where: {id: ctx.params.product_id},
            populate: {labels: true}
        })
        if(findProduct === undefined){
            var returner = {
                "status": 604,
                "message": "product_id does not exist"
            }
            ctx.response.status = returner.status
            return returner
        }

        var findLabel = await strapi.db.query('api::label.label').findOne({
            where: {id: ctx.params.label_id},
        })
        if(findLabel === undefined){
            var returner = {
                "status": 604,
                "message": "label_id does not exist"
            }
            ctx.response.status = returner.status
            return returner
        }

        findProduct.labels.push(findLabel)
        var input = {
            labels: findProduct.labels
        }
        var result = await strapi.service('api::product.product').update( ctx.params.product_id, { data: input });

        var returner
        if (!(result === null || result === undefined)) {
            returner = {
                "status": 200,
                "message": "Add label successful"
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
    async deleteLabel(ctx){
        var findProduct = await strapi.db.query('api::product.product').findOne({
            where: {id: ctx.params.product_id},
            populate: {labels: true}
        })
        if(findProduct === undefined){
            var returner = {
                "status": 604,
                "message": "product_id does not exist"
            }
            ctx.response.status = returner.status
            return returner
        }

        var isFound = false
        // console.log(ctx.params.label_id)
        for(var eachlabel of findProduct.labels){
            // console.log(eachlabel.id)
            if(eachlabel.id === parseInt(ctx.params.label_id)){
                console.log('found')
                isFound = true
                const index = findProduct.labels.indexOf(eachlabel);
                findProduct.labels.splice(index, 1);
                break
            }
        }
        if(isFound === false){
            var returner = {
                "status": 604,
                "message": "label_id does not exist"
            }
            ctx.response.status = returner.status
            return returner
        }

        var input = {
            labels: findProduct.labels
        }
        var result = await strapi.service('api::product.product').update( ctx.params.product_id, { data: input });

        var returner
        if (!(result === null || result === undefined)) {
            returner = {
                "status": 200,
                "message": "Delete label successful"
            }
        } else {
            returner = {
                "status": 200,
                "message": "Nothing needs to be deleted"
            }
        }
        ctx.response.status = returner.status
        return returner
    },

    async storehouseTransfer(ctx){
        let {
            variation,
            storehouse_from,
            storehouse_to,
            quantity
        } = ctx.request.body;

        // console.log("ctx.request.body:")
        // console.log(ctx.request.body)
        // console.log("ctx.params.id:")
        // console.log(ctx.params.id)

        var findStockFrom = await strapi.db.query('api::stock.stock').findOne({
            where: {
                product: ctx.params.id,
                variation: variation,
                storehouse: storehouse_from
            }
        })
        var findStockTo = await strapi.db.query('api::stock.stock').findOne({
            where: {
                product: ctx.params.id,
                variation: variation,
                storehouse: storehouse_to
            }
        })

        // console.log("findStockFrom:")
        // console.log(findStockFrom)
        // console.log("findStockTo:")
        // console.log(findStockTo)

        findStockFrom.quantity -= quantity
        if(findStockFrom.quantity < 0){
            var returner = {
                "status": 606,
                "message": "The storehouse does not have this much product to transfer!"
            }
            ctx.response.status = returner.status
            return returner
        }
        findStockTo.quantity += quantity

        var inputFrom = {
            quantity: findStockFrom.quantity
        }
        var resultFrom = await strapi.service('api::stock.stock').update( findStockFrom.id, { data: inputFrom });

        var inputTo = {
            quantity: findStockTo.quantity
        }
        var resultTo = await strapi.service('api::stock.stock').update( findStockTo.id, { data: inputTo });

        var returner
        if (!(resultFrom === null || resultFrom === undefined || resultTo === null || resultTo === undefined)) {
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

    async cashierFind(ctx){
        ctx.query.fields = [
            'product_id',
            'name',
            'new_lowest_price',
            'new_selling_price',
            'new_restock_date',
            'average_restock_price'
        ]

        ctx.query.populate = {
            stocks: {
                populate: {
                    storehouse: true,
                    variation: true
                }
            },
            variations: true,
            restocks: {
                sort: ['restock_date:desc'],
                populate: {
                    supplier: {
                        fields: [
                            'name'
                        ]
                    },
                    restock_distribute: {
                        populate: {
                            storehouse: true,
                            variation: true
                        }
                    }
                }
            },
            broken_products: {
                populate: {
                    storehouse: true,
                    variation: true,
                }
            },
            labels: true,
        }

        ctx.query.filters = {}
        if(!(ctx.query.label === undefined || ctx.query.label === null || ctx.query.label === '')) {
            ctx.query.filters.labels = {id: parseInt(ctx.query.label)}
        }
        if(!(ctx.query.search === undefined || ctx.query.search === null || ctx.query.search === '')) {
            ctx.query.filters.$or = [
                {product_id: {$contains: ctx.query.search}},
                {name: {$contains: ctx.query.search}},
            ]
        }

        // console.log(ctx.query)

        var { data, meta } = await super.find(ctx);

        // console.log(data.restocks)
        // console.log(data)

        for(var eachData of data){
            // console.log(eachData)
            // console.log(eachData.attributes)

            eachData.attributes.new_restock_price = 0
            if(eachData.attributes.restocks.data.length > 0){
                var newRestock = eachData.attributes.restocks.data[0]
                eachData.attributes.new_restock_price = newRestock.attributes.restock_price
                eachData.attributes.new_restock_id = newRestock.id
            }

            var storehouse_info = []
            for(var eachStock of eachData.attributes.stocks.data){
                // console.log(eachStock.attributes.variation.data)
                // eachData.attributes.total_stock += eachStock.attributes.quantity
                var isFound = false
    
                var pushVariation = {
                    id: eachStock.attributes.variation.data.id,
                    name: eachStock.attributes.variation.data.attributes.name,
                    quantity: eachStock.attributes.quantity,
                }

                // console.log(pushVariation)
                // console.log(eachStock.attributes.storehouse.data.id)
                // console.log("for")
    
                for(var eachStockInfo of storehouse_info){
                    // console.log(eachStockInfo.storehouse_id)
                    if(eachStockInfo.storehouse_id === eachStock.attributes.storehouse.data.id){
                        // console.log("found")
                        eachStockInfo.variation.push(pushVariation)
                        isFound = true
                        break
                    }
                }
                // console.log(" ")
    
                if(!isFound){
                    var one_storehouse_info = {
                        storehouse_id: eachStock.attributes.storehouse.data.id,
                        storehouse_name: eachStock.attributes.storehouse.data.attributes.name,
                        // quantity: eachStock.attributes.quantity,
                        phone_no: eachStock.attributes.storehouse.data.attributes.phone_no,
                        storehouse_address: eachStock.attributes.storehouse.data.attributes.address,
                        variation: [pushVariation]
                    }
                    storehouse_info.push(one_storehouse_info)
                }

            }
            eachData.attributes.storehouse_info = storehouse_info
            delete eachData.attributes.stocks

            eachData.attributes.total_broken_products = 0
            for(var eachBrokenProduct of eachData.attributes.broken_products.data){
                var today = new Date()
                var year = today.getFullYear()
                var month = ("0" + (today.getMonth() + 1)).slice(-2);
                var firstDay = year + "-" + month + "-01"
                var firstDayDateType = new Date(firstDay)
                var targetDayDateType = new Date(eachBrokenProduct.attributes.date)
                if(targetDayDateType >= firstDayDateType){
                    eachData.attributes.total_broken_products += eachBrokenProduct.attributes.quantity
                }
                
            }
            // delete data.attributes.broken_products   
        }

        // some more logic

        return { data, meta };
    },

    async exportExcelProduct(ctx){
        ctx.query.fields = [
            'product_id',
            'name',
            'new_restock_date',
            'new_lowest_price',
            'new_selling_price',
            'average_restock_price'
        ]

        ctx.query.populate = {
            supplier: true,
            stocks: {
                populate: {
                    storehouse: true,
                    variation: true
                }
            },
            restocks: {
                sort: ['restock_date:desc'],
                fields: ['restock_price']
            },
        }

        // console.log(ctx.query)

        ctx.query.filters = {}
        if(!(ctx.query.label === undefined || ctx.query.label === null || ctx.query.label === '')) {
            ctx.query.filters.labels = {id: parseInt(ctx.query.label)}
        }
        if(!(ctx.query.supplier === undefined || ctx.query.supplier === null || ctx.query.supplier === '')) {
            ctx.query.filters.supplier = {id: parseInt(ctx.query.supplier)}
        }
        if(!(ctx.query.new_restock_date === undefined || ctx.query.new_restock_date === null || ctx.query.new_restock_date === '')) {
            var currentDate = new Date(ctx.query.new_restock_date)
            currentDate.setDate(currentDate.getDate() + 1)
            let day = ("0" + currentDate.getDate()).slice(-2);
            let month = ("0" + (currentDate.getMonth() + 1)).slice(-2);
            let year = currentDate.getFullYear();
            var endDate = year + '-' + month + '-' + day
            ctx.query.filters.new_restock_date = {
                $gte: ctx.query.new_restock_date,
                $lt: endDate
            }
        }
        if(!(ctx.query.search === undefined || ctx.query.search === null || ctx.query.search === '')) {
            ctx.query.filters.$or = [
                {product_id: {$contains: ctx.query.search}},
                {name: {$contains: ctx.query.search}},
            ]
        }

        ctx.query.pagination = {
            page: 1,
            pageSize: 100,
        }

        // console.log(ctx.query.filters)

        var { meta } = await super.find(ctx);

        // some more logic

        var foundAllProduct = []
        var ctx2 = ctx

        for(var page = 1; page <= meta.pagination.pageCount; page ++){
            // console.log("loop page " + page)
            ctx2.query.pagination = {
                page: page,
                pageSize: meta.pagination.pageSize,
            }

            var { data } = await super.find(ctx2);
            
            for(var eachData of data){
                foundAllProduct.push(eachData)
            }
        }

        var result = await strapi.service('api::product.product').exportExcelProduct(foundAllProduct);

        return result;
    },
}));
