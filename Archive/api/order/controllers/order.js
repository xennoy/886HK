'use strict';

/**
 * order controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::order.order', ({ strapi }) => ({
    async find(ctx){
        ctx.query.fields = [
            'order_id',
            'order_date',
            'status',
            'total_price',
            'refunded_remarks'
        ]

        ctx.query.populate = {
            member: {
                fields: ['name']
            },
            cashier: {
                fields: ['name']
            },
            ordered_product: {
                populate: {
                    product: {
                        fields: ['name'],
                        populate: {remarks: true}
                    },
                    variation: true
                }
            },
            discount: true,
            payment_method: true,
            order_shop: true
        }

        ctx.query.filters = {}
        if(!(ctx.query.time_period === undefined || ctx.query.time_period === null || ctx.query.time_period === '')) {
            var currentDate = new Date()
            currentDate.setDate(currentDate.getDate() - parseInt(ctx.query.time_period))
            let day = ("0" + currentDate.getDate()).slice(-2);
            let month = ("0" + (currentDate.getMonth() + 1)).slice(-2);
            let year = currentDate.getFullYear();   
            var period_date = year + '-' + month + '-' + day

            ctx.query.filters.order_date = {$gte: period_date}
        }
        if(!(ctx.query.date === undefined || ctx.query.date === null || ctx.query.date === '')) {
            var currentDate = new Date(ctx.query.date)
            currentDate.setDate(currentDate.getDate() + 1)
            let day = ("0" + currentDate.getDate()).slice(-2);
            let month = ("0" + (currentDate.getMonth() + 1)).slice(-2);
            let year = currentDate.getFullYear();   
            var next_date = year + '-' + month + '-' + day

            ctx.query.filters.order_date = {$gte: ctx.query.date, $lt: next_date}
        }

        if(!(ctx.query.status === undefined || ctx.query.status === null || ctx.query.status === '')) {
            ctx.query.filters.status = ctx.query.status
        }
        if(!(ctx.query.member === undefined || ctx.query.member === null || ctx.query.member === '')) {
            ctx.query.filters.member = {id: ctx.query.member}
        }
        if(!(ctx.query.order_id === undefined || ctx.query.order_id === null || ctx.query.order_id === '')) {
            ctx.query.filters.order_id = {$contains: ctx.query.order_id}
        }

        var { data, meta } = await super.find(ctx);

        // some more logic

        return { data, meta };
    },
    async findOne(ctx){
        ctx.query.fields = [
            'order_id',
            'status',
            'total_price',
            'refunded_remarks',
            'order_date'
        ]

        ctx.query.populate = {
            cashier: {
                fields: ['name']
            },
            member: {
                fields: ['name']
            },
            member_level: {
                fields: ['name']
            },
            ordered_product: {
                populate: {
                    product: {
                        fields: ['name'],
                        populate: {remarks: true}
                    },
                    variation: true
                }
            },
            discount: true,
            payment_method: true,
            order_shop: true
        }

        ctx.query.filters = {id: ctx.params.id}

        var { data, meta } = await super.find(ctx);
        data = data[0]

        // some more logic

        return { data, meta };
    },

    async create(ctx){
        let {
            member,
            status,
            ordered_product,
            discount,
            payment_method,
        } = ctx.request.body;

        if(
            status === undefined || status === null || status === "" ||
            payment_method.length === 0 ||
            ordered_product.length === 0
        ){
            var returner = {
                "status": 610,
                "message": "Something missing in your input!"
            }
            ctx.response.status = returner.status
            return returner
        }

        // console.log(ctx.state.user)

        var cashier = ctx.state.user

        var findCashier = await strapi.db.query('plugin::users-permissions.user').findOne({ 
            where: {
                id: ctx.state.user.id
            },
            populate: {
                storehouse: true
            }
        })

        var storehouse = findCashier.storehouse

        var currentDate = new Date()
        let day = ("0" + currentDate.getDate()).slice(-2);
        let month = ("0" + (currentDate.getMonth() + 1)).slice(-2);
        let year = currentDate.getFullYear();
        var orderIDDate = year + month + day
        var findOrderCount = await strapi.db.query('api::order.order').count({ 
            where: {
                order_id: {
                    $contains: orderIDDate
                },
            },
        })
        var orderIDCount = ("000000" + findOrderCount.toString()).slice(-6)
        var order_id = orderIDDate + orderIDCount

        var member_level = undefined
        if(!(member === undefined || member === null || member === "")){
            var findMember = await strapi.db.query('api::member.member').findOne({ 
                where: {
                    id: member
                },
                populate: {
                    member_level: true
                }
            })
            member_level = findMember.member_level
        }

        var order_total_price = 0.00
        var order_total_profit = 0.00
        // ordered_product = {
        //     product,
        //     variation,
        //     discount_deduction,
        //     quantity,
        // }
        for(var eachOrderedProduct of ordered_product){
            if(
                eachOrderedProduct.product === undefined || eachOrderedProduct.product === null || eachOrderedProduct.product === "" ||
                eachOrderedProduct.variation === undefined || eachOrderedProduct.variation === null || eachOrderedProduct.variation === "" ||
                eachOrderedProduct.discount_deduction === undefined || eachOrderedProduct.discount_deduction === null || eachOrderedProduct.discount_deduction === "" ||
                eachOrderedProduct.quantity === undefined || eachOrderedProduct.quantity === null || eachOrderedProduct.quantity === ""
            ){
                var returner = {
                    "status": 610,
                    "message": "Something missing in your input!"
                }
                ctx.response.status = returner.status
                return returner
            }
            if(eachOrderedProduct.quantity === 0){
                var returner = {
                    "status": 606,
                    "message": "One of your ordered_product quantity is 0, which is not valid!"
                }
                ctx.response.status = returner.status
                return returner
            }

            var findProduct = await strapi.db.query('api::product.product').findOne({ 
                where: {
                    id: eachOrderedProduct.product
                },
            })
            eachOrderedProduct.discount_deduction = parseFloat(parseFloat(eachOrderedProduct.discount_deduction).toFixed(2))
            eachOrderedProduct.selling_price = parseFloat(parseFloat(findProduct.new_selling_price).toFixed(2))
            eachOrderedProduct.average_restock_price = parseFloat(parseFloat(findProduct.average_restock_price).toFixed(2))
            eachOrderedProduct.total_price = parseFloat((eachOrderedProduct.selling_price * eachOrderedProduct.quantity - eachOrderedProduct.discount_deduction).toFixed(2))
            eachOrderedProduct.profit = parseFloat(parseFloat((eachOrderedProduct.selling_price - eachOrderedProduct.average_restock_price) * eachOrderedProduct.quantity - eachOrderedProduct.discount_deduction).toFixed(2))
            order_total_price += eachOrderedProduct.total_price
            order_total_profit += eachOrderedProduct.profit
            // console.log(eachOrderedProduct.discount_deduction)
            // console.log(eachOrderedProduct.selling_price)
            // console.log(eachOrderedProduct.average_restock_price)
            // console.log(eachOrderedProduct.total_price)
            // console.log(eachOrderedProduct.profit)
        }
        // console.log(order_total_price)
        // console.log(order_total_profit)

        var order_discount = 0.00
        for(var eachDiscount of discount){
            order_discount += parseFloat(parseFloat(eachDiscount.discount_deduction).toFixed(2))
        }

        order_total_price -= parseFloat(parseFloat(order_discount).toFixed(2))
        order_total_profit -= parseFloat(parseFloat(order_discount).toFixed(2))
        if(order_total_price < 0){
            var returner = {
                "status": 606,
                "message": "Total price is lower than 0!"
            }
            ctx.response.status = returner.status
            return returner
        }

        var paymentPrice = 0
        for(var eachPaymentMethod of payment_method){
            paymentPrice += parseFloat(parseFloat(eachPaymentMethod.price).toFixed(2))
        }

        // console.log(order_total_price)
        // console.log(paymentPrice)
        if(order_total_price != paymentPrice){
            var returner = {
                "status": 606,
                "message": "Payment price is not equal to total price of the order!"
            }
            ctx.response.status = returner.status
            return returner
        }

        var input = {
            order_id: order_id,
            order_date: currentDate,
            cashier: cashier,
            status: status,
            ordered_product: ordered_product,
            discount: discount,
            total_price: order_total_price,
            payment_method: payment_method,
            total_profit: order_total_profit,
            order_shop: storehouse
        }
        if(!(member === undefined || member === null || member === "")){
            input.member = member
            input.member_level = member_level
        }

        var changeList = []
        for(var eachOrderedProduct of ordered_product){
            // console.log(eachOrderedProduct.product)
            // console.log(eachOrderedProduct.variation)
            // console.log(storehouse)
            var findStock = await strapi.db.query('api::stock.stock').findOne({ 
                where: {
                    product: eachOrderedProduct.product,
                    variation: eachOrderedProduct.variation,
                    storehouse: storehouse
                }
            })
    
            findStock.quantity -= eachOrderedProduct.quantity
            if(findStock.quantity < 0){
                var returner = {
                    "status": 606,
                    "message": "The storehouse does not have this much product to be orederd!"
                }
                ctx.response.status = returner.status
                return returner
            }

            var change = {
                id: findStock.id,
                quantity: findStock.quantity,
            }

            changeList.push(change)
        }
        // console.log(input)
        // console.log(changeList)
        var result = await strapi.service('api::order.order').create({ data: input });
        for(var eachChange of changeList){
            var stock_id = eachChange.id
            delete eachChange.id
            var updateStock = await strapi.service('api::stock.stock').update( stock_id, { data: eachChange });
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

        var findResult = await strapi.db.query('api::order.order').findOne({ 
            where: {
                id: result.id
            },
            select: [
                'order_id',
                'order_date',
                'status',
                'total_price',
                'refunded_remarks'
            ],
            populate: {
                member: {
                    select: ['name']
                },
                cashier: {
                    select: ['name']
                },
                ordered_product: {
                    populate: {
                        product: {
                            select: ['name'],
                            populate: {remarks: true}
                        },
                        variation: true
                    }
                },
                discount: true,
                payment_method: true,
                order_shop: true
            }
        })

        return findResult
    },

    async getProfit(ctx){
        ctx.query.fields = [
            'order_id',
            'order_date',
            'total_price',
            'total_profit'
        ]

        ctx.query.populate = {
            member: {
                fields: ['name']
            },
            cashier: {
                fields: ['name']
            },
        }

        // console.log(ctx.query)

        ctx.query.filters = {}
        ctx.query.filters.order_date = {}
        if(!(ctx.query.time_period === undefined || ctx.query.time_period === null || ctx.query.time_period === '')) {
            var currentDate = new Date()
            currentDate.setDate(currentDate.getDate() - parseInt(ctx.query.time_period))
            let day = ("0" + currentDate.getDate()).slice(-2);
            let month = ("0" + (currentDate.getMonth() + 1)).slice(-2);
            let year = currentDate.getFullYear();   
            var period_date = year + '-' + month + '-' + day

            ctx.query.filters.order_date.$gte = period_date
        } else {
            if(!(ctx.query.startDate === undefined || ctx.query.startDate === null || ctx.query.startDate === '')) {
                ctx.query.filters.order_date.$gte = ctx.query.startDate
            }
            if(!(ctx.query.endDate === undefined || ctx.query.endDate === null || ctx.query.endDate === '')) {
                ctx.query.filters.order_date.$lt = ctx.query.endDate
            }
        }

        if(!(ctx.query.status === undefined || ctx.query.status === null || ctx.query.status === '')) {
            ctx.query.filters.status = ctx.query.status
        }
        if(!(ctx.query.cashier === undefined || ctx.query.cashier === null || ctx.query.cashier === '')) {
            ctx.query.filters.cashier = {id: parseInt(ctx.query.cashier)}
        }
        if(!(ctx.query.order_id === undefined || ctx.query.order_id === null || ctx.query.member === '')) {
            ctx.query.filters.order_id = {$contains: ctx.query.order_id}
        }

        // console.log(ctx.query.filters)

        var { data, meta } = await super.find(ctx);

        // console.log("start calculating total_profit")
        // console.log(meta.pagination.pageCount)

        var total_profit = 0

        var ctx2 = ctx
        for(var page = 1; page <= meta.pagination.pageCount; page ++){
            // console.log("loop page " + page)
            ctx2.query.pagination = {
                page: page,
                pageSize: meta.pagination.pageSize,
            }

            var result = await super.find(ctx2);
            
            for(var eachData of result.data){
                // console.log(eachData.attributes.total_profit)
                total_profit += eachData.attributes.total_profit
            }
            // console.log("total at this time: " + total_profit)
        }

        total_profit = parseFloat(parseFloat(total_profit).toFixed(2))

        // some more logic

        return { data, meta, total_profit };
    },

    async refund(ctx){
        let {
            refunded_info,
            refunded_remarks,
            storehouse
        } = ctx.request.body;

        var findOrder = await strapi.db.query('api::order.order').findOne({ 
            where: {
                id: ctx.params.id,
            },
            populate: {
                ordered_product: {
                    populate: {
                        product: true,
                        variation: true
                    }
                }
            }
        })

        var ordered_product = findOrder.ordered_product

        var total_refunded_price = 0
        var total_refunded_profit = 0
        var isRefundedAll = true
        // refunded_info = {product_id, variation, refunded_quantity, refunded_price}
        for(var eachData of refunded_info){
            for(var eachProduct of ordered_product){
                // console.log(eachProduct)
                // console.log(eachProduct.product)
                if(eachData.product === eachProduct.product.id && eachData.variation === eachProduct.variation.id){
                    eachProduct.refunded_quantity += eachData.refunded_quantity
                    if(eachProduct.refunded_quantity > eachProduct.quantity){
                        var returner = {
                            "status": 606,
                            "message": "One of the refunded_quantity is larger than the quantity this order has!"
                        }
                        ctx.response.status = returner.status
                        return returner
                    }
                    eachProduct.profit -= eachData.refunded_price
                    eachProduct.refunded_price += eachData.refunded_price
                    total_refunded_price += eachData.refunded_price
                    total_refunded_profit += eachData.refunded_price
                    break
                }
            }
        }

        // findOrder.total_price -= total_refunded_price
        findOrder.total_refunded_price += eachData.refunded_price
        findOrder.total_profit -= total_refunded_profit

        for(var eachProduct of ordered_product){
            if(eachProduct.refunded_quantity < eachProduct.quantity){
                isRefundedAll = false
                break
            }
        }
        if(isRefundedAll){
            findOrder.status = "refunded"
        } else {
            findOrder.status = "partially_refunded"
        }

        var input = {
            ordered_product: ordered_product,
            refunded_remarks: refunded_remarks,
            total_refunded_price: findOrder.total_refunded_price,
            total_profit: findOrder.total_profit,
            status: findOrder.status
        }
        var result = await strapi.service('api::order.order').update( ctx.params.id, { data: input });

        for(var eachData of refunded_info){
            var findStock = await strapi.db.query('api::stock.stock').findOne({ 
                where: {
                    product: eachData.product,
                    variation: eachData.variation,
                    storehouse: storehouse,
                },
            })

            var updateStockInput = {
                quantity: findStock.quantity + eachData.refunded_quantity
            }
            var updateStock = await strapi.service('api::stock.stock').update( findStock.id, { data: updateStockInput });
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

    async cashierFind(ctx){
        ctx.query.fields = [
            'order_id',
            'status',
            'total_price',
            'refunded_remarks',
            'order_date'
        ]

        ctx.query.populate = {
            cashier: {
                fields: ['name']
            },
            member: {
                fields: ['name']
            },
            ordered_product: {
                populate: {
                    product: {
                        fields: ['name'],
                        populate: {remarks: true}
                    },
                    variation: true
                }
            },
            discount: true,
            payment_method: true,
            order_shop: true
        }

        ctx.query.filters = {}
        if(!(ctx.query.time_period === undefined || ctx.query.time_period === null || ctx.query.time_period === '')) {
            var currentDate = new Date()
            currentDate.setDate(currentDate.getDate() - parseInt(ctx.query.time_period))
            let day = ("0" + currentDate.getDate()).slice(-2);
            let month = ("0" + (currentDate.getMonth() + 1)).slice(-2);
            let year = currentDate.getFullYear();   
            var period_date = year + '-' + month + '-' + day

            ctx.query.filters.order_date = {$gte: period_date}
        }

        if(!(ctx.query.status === undefined || ctx.query.status === null || ctx.query.status === '')) {
            ctx.query.filters.status = ctx.query.status
        }
        if(!(ctx.query.cashier === undefined || ctx.query.cashier === null || ctx.query.cashier === '')) {
            ctx.query.filters.cashier = {id: ctx.query.cashier}
        }
        if(!(ctx.query.order_id === undefined || ctx.query.order_id === null || ctx.query.order_id === '')) {
            ctx.query.filters.order_id = {$contains: ctx.query.order_id}
        }

        var { data, meta } = await super.find(ctx);

        // some more logic

        return { data, meta };
    },

    async setStatus(ctx){
        let {
            status
        } = ctx.request.body;

        var input = {
            status: status
        }

        var result = await strapi.service('api::order.order').update( ctx.params.id, { data: input });

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
