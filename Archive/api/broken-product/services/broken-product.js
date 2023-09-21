'use strict';

/**
 * broken-product service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::broken-product.broken-product');
