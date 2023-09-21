'use strict';

/**
 * member-level service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::member-level.member-level');
