module.exports = {
    routes: [
      { // Path for patching one data
        method: 'PATCH',
        path: '/variations/:id', 
        handler: 'variation.update',
      },

      
    ]
}