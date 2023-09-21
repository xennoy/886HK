'use strict';

/**
 * member-level router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::member-level.member-level');
