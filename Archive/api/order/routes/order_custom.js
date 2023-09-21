module.exports = {
    routes: [
      { // Path for patching one data
        method: 'PATCH',
        path: '/orders/:id', 
        handler: 'order.update',
      },

      { // Path for patching one data
        method: 'PATCH',
        path: '/order_refund/:id', 
        handler: 'order.refund',
      },

      { // Path for getting profit list
        method: 'GET',
        path: '/order_profit_list', 
        handler: 'order.getProfit',
      },

      { // Path for getting order for cashier
        method: 'GET',
        path: '/cashier_orders', 
        handler: 'order.cashierFind',
      },

      { // Path for patching one data
        method: 'PATCH',
        path: '/order_set_status/:id', 
        handler: 'order.setStatus',
      },
    ]
}