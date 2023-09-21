'use strict';

/**
 * storehouse router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::storehouse.storehouse',{
    except: ['update', 'delete'],
});
