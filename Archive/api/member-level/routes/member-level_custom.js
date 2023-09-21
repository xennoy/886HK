module.exports = {
    routes: [
      { // Path for patching one data
        method: 'PATCH',
        path: '/member-levels/:id', 
        handler: 'member-level.update',
      },

      
    ]
}