module.exports = {
    routes: [
      { // Path for patching one data
        method: 'PATCH',
        path: '/members/:id', 
        handler: 'member.update',
      },

      
    ]
}