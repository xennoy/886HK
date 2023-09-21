'use strict';

/**
 * Auth.js controller
 *
 * @description: A set of functions called "actions" for managing `Auth`.
 */

/* eslint-disable no-useless-escape */
const axios = require('axios');
const crypto = require('crypto');
const _ = require('lodash');
const utils = require('@strapi/utils');
const { getService } = require('./utils');
const {
  validateCallbackBody,
  validateRegisterBody,
  validateSendEmailConfirmationBody,
  validateForgotPasswordBody,
  validateResetPasswordBody,
  validateEmailConfirmationBody,
} = require('./controllers/validation/auth');

const {
  getPaginationInfo,
  convertPagedToStartLimit,
  shouldCount,
  transformPaginationResponse,
} = require('./controllers/pagination');

const { getAbsoluteAdminUrl, getAbsoluteServerUrl, sanitize } = utils;
const { ApplicationError, ValidationError } = utils.errors;

const sanitizeUser = (user, ctx) => {
  const { auth } = ctx.state;
  const userSchema = strapi.getModel('plugin::users-permissions.user');

  return sanitize.contentAPI.output(user, userSchema, { auth });
};

const emailRegExp = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;



module.exports = (plugin) => {
  //extend user service
  const oldUserServices = plugin.services.user;
  const oldAuthCallbackControllers = plugin.controllers.auth.callback;

  plugin.services.user = ({strapi}) => {
    return {
      ...oldUserServices({strapi}),
      
    }
  },
  //extend user controller
  
  plugin.controllers.user.find = async(ctx) =>{
    ctx.query.fields = [
      'name',
      'phone_no',
      'email',
    ]

    ctx.query.populate = {
      role: true,
      storehouse: true
    }

    ctx.query.filters = {}
    if(!(ctx.query.search === undefined || ctx.query.search === null || ctx.query.search === '')) {
      ctx.query.filters.$or = [
        {name: {$contains: ctx.query.search}},
        {phone_no: {$contains: ctx.query.search}},
        {email: {$contains: ctx.query.search}},
      ]
    }
    
    const { query } = ctx;
    const paginationInfo = getPaginationInfo(query);

    var data = await strapi.entityService.findMany('plugin::users-permissions.user', {
      ...query,
      ...convertPagedToStartLimit(paginationInfo),
    });

    for(var eachData of data){
      if(eachData.role.type === "admin"){
        eachData.isAdmin = true
      }else{
        eachData.isAdmin = false
      }
      delete eachData.role
    }

    if (shouldCount(query)) {
      const count = await strapi.entityService.count('plugin::users-permissions.user', { ...query, ...paginationInfo });

      return {
        data,
        meta: {pagination: transformPaginationResponse(paginationInfo, count)},
      };
    }
    return {
      data,
      meta: {pagination: paginationInfo},
    };
  }

  plugin.controllers.user.findOne = async(ctx) =>{
    ctx.query.fields = [
      'name',
      'phone_no',
      'email',
    ]

    ctx.query.populate = {
      role: true,
      storehouse: true
    }
    
    const { query } = ctx;
    const paginationInfo = getPaginationInfo(query);

    var data = await strapi.entityService.findOne('plugin::users-permissions.user', ctx.params.id ,{
      ...query,
      ...convertPagedToStartLimit(paginationInfo),
    });

    if(data.role.type === "admin"){
      data.isAdmin = true
    }else{
      data.isAdmin = false
    }
    delete data.role

    if (shouldCount(query)) {
      const count = await strapi.entityService.count('plugin::users-permissions.user', { ...query, ...paginationInfo });

      return {
        data,
        meta: {pagination: transformPaginationResponse(paginationInfo, count)},
      };
    }
    return {
      data,
      meta: {pagination: paginationInfo},
    };
  }

  plugin.controllers.user.create = async(ctx) => {
    let {
      name,
      email,
      phone_no,
      password,
      storehouse,
      isAdmin
    } = ctx.request.body

    if(name === undefined || name === "" || 
      email === undefined || email === "" || 
      phone_no === undefined || phone_no === "" || 
      password === undefined || password === "" || 
      // storehouse === undefined || storehouse === "" || 
      isAdmin === undefined){
        var returner = {
          "status": 604,
          "message": "All fields cannot be null or empty"
        }
        ctx.response.status = returner.status
        return returner
    }

    var findRole
    if(isAdmin){
      findRole = await strapi.db.query('plugin::users-permissions.role').findOne({where : {type : 'admin'}})
    }else{
      findRole = await strapi.db.query('plugin::users-permissions.role').findOne({where : {type : 'authenticated'}})
    }

    var findStorehouse = await strapi.db.query('api::storehouse.storehouse').findOne({where : {id : storehouse}})

    var input = {
      username: email,
      email: email,
      password: password,
      name: name,
      phone_no: phone_no,
      storehouse: findStorehouse,
      role: findRole,
      confirmed: true,
      blocked: false
    }

    // console.log(input)

    // await axios.post('http://localhost:1337/api/auth/local/register', input)
    await axios.post('http://127.0.0.1:1337/api/auth/local/register', input)

    var returner = {
      "status": 200,
      "message": "Create user success!"
    }
    ctx.response.status = returner.status
    return returner
  }

  plugin.controllers.user.update = async(ctx) => {
    let {
      name,
      email,
      phone_no,
      storehouse,
      // password,
      isAdmin
    } = ctx.request.body

    if(name === undefined || name === "" || 
      email === undefined || email === "" || 
      phone_no === undefined || phone_no === "" || 
      // storehouse === undefined || storehouse === "" || 
      // password === undefined || password === "" || 
      isAdmin === undefined){
        var returner = {
          "status": 604,
          "message": "All fields cannot be null or empty"
        }
        ctx.response.status = returner.status
        return returner
    }

    var findRole
    if(isAdmin){
      findRole = await strapi.db.query('plugin::users-permissions.role').findOne({where : {type : 'admin'}})
    }else{
      findRole = await strapi.db.query('plugin::users-permissions.role').findOne({where : {type : 'authenticated'}})
    }

    var input = {
      username: email,
      email: email,
      name: name,
      phone_no: phone_no,
      storehouse: storehouse,
      role: findRole
    }

    var result = await strapi.service("plugin::users-permissions.user").edit(ctx.params.id, input);

    var returner = {
      "status": 200,
      "message": "Update user success!"
    }
    ctx.response.status = returner.status
    return returner
  }

  plugin.controllers.user.findCurrentUser = async(ctx) =>{
    ctx.query.fields = [
      'name',
      'phone_no',
      'email',
    ]

    ctx.query.populate = {
      role: true,
      storehouse: true
    }
    
    const { query } = ctx;
    const paginationInfo = getPaginationInfo(query);

    var data = await strapi.entityService.findOne('plugin::users-permissions.user', ctx.state.user.id ,{
      ...query,
      ...convertPagedToStartLimit(paginationInfo),
    });

    if(data.role.type === "admin"){
      data.isAdmin = true
    }else{
      data.isAdmin = false
    }
    delete data.role

    if (shouldCount(query)) {
      const count = await strapi.entityService.count('plugin::users-permissions.user', { ...query, ...paginationInfo });

      return {
        data,
        meta: {pagination: transformPaginationResponse(paginationInfo, count)},
      };
    }
    return {
      data,
      meta: {pagination: paginationInfo},
    };
  }

  plugin.routes['content-api'].routes.push(
    {
      method: 'PATCH',
      path: '/users/:id',
      handler: 'user.update',
    },
    
    {
      method: 'GET',
      path: '/current_user',
      handler: 'user.findCurrentUser',
    },
  )
  return plugin;
};
