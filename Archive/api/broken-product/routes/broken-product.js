'use strict';

/**
 * broken-product router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::broken-product.broken-product',{
    except: ['update'],
});
