module.exports = {
    routes: [
      { // Path for patching one data
        method: 'PATCH',
        path: '/suppliers/:id', 
        handler: 'supplier.update',
      },

      
    ]
}