'use strict';

/**
 * storehouse service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::storehouse.storehouse');
