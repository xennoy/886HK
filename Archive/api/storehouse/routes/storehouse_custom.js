module.exports = {
    routes: [
      { // Path for patching one data
        method: 'PATCH',
        path: '/storehouses/:id', 
        handler: 'storehouse.update',
      },

      
    ]
}