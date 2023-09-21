module.exports = {
    routes: [
      { // Path for patching one data
        method: 'PATCH',
        path: '/labels/:id', 
        handler: 'label.update',
      },

      
    ]
}