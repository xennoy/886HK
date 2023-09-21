module.exports = {
    routes: [
      { // Path for patching one data
        method: 'PATCH',
        path: '/products/:id', 
        handler: 'product.update',
      },

      { // Path for adding label
        method: 'PATCH',
        path: '/products_add_label/:product_id/:label_id', 
        handler: 'product.addLabel',
      },
      { // Path for deleting label
        method: 'PATCH',
        path: '/products_delete_label/:product_id/:label_id', 
        handler: 'product.deleteLabel',
      },

      { // Path for changing location of product between different storehouse
        method: 'PATCH',
        path: '/products_storehouse_transfer/:id', 
        handler: 'product.storehouseTransfer',
      },

      { // Path for getting data for cashier
        method: 'GET',
        path: '/cashier_products', 
        handler: 'product.cashierFind',
      },

      { // Path for creating excel for product list
        method: 'GET',
        path: '/export_excel_product', 
        handler: 'product.exportExcelProduct',
      },
    ]
}