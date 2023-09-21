'use strict';

/**
 * wc-state service.
 */

const { createCoreService } = require('@strapi/strapi').factories;

async function mkState(key,state){
    var state = {
      code : key,
      name : state["en"],
      translation: state,
      isIncluded : true
    }
    return state
}
async function updateState(element, country_db, db_name){
    var updated = []
    for (var countryCode in element) {
      for (var stateCode in element[countryCode]){
        const country =  await strapi.db.query(country_db).findOne({where:{code: countryCode}});
        const currentResult =  await strapi.db.query(db_name).findOne({where: {code: stateCode, country: { code: countryCode}} });
        var state = await mkState(stateCode,element[countryCode][stateCode])
        state.country = country.id
        if ( currentResult != null ){
            state.id = currentResult.id
            await strapi.service(db_name).update( currentResult.id, {data : state} );
        }else{
            await strapi.service(db_name).create( {data: state} );
        }
        updated.push(countryCode + "-" + stateCode)
      }
    }
    return updated
}
module.exports = createCoreService('api::wc-state.wc-state', ({ strapi }) => ({
    async find(params) {
        if(params._limit == undefined){
            params._limit = -1
        }
        if(params.isIncluded == undefined){
            params.isIncluded = true
        }
        var { results, pagination } = await super.find(params);
        var results = results.map(({createdAt, updatedAt, ...rest}) => 
            {
                return rest
            }
        );

        return { results, pagination }
    },
    async getFromWP(){
        const setting = await strapi.plugin('wordpress').service('setting')
        const country_db = 'api::wc-country.wc-country'
        const state_db = 'api::wc-state.wc-state' 

        var wooData = await strapi.plugin('wordpress').service('wpLink').getCountryStateFromAPI('states')
        var stateList = await updateState( wooData, country_db, state_db);

        var nextPage = true
        var offset = 0
        while (nextPage){
            var stateStored = await strapi.db.query(state_db).findMany({limit : setting.maxPerPage, offset : offset, populate: {country:true}})
            var itemCount = stateStored.length
            if (itemCount < setting.maxPerPage){
                /* if item returned is less than max per page ( = last page ) */
                nextPage = false
            }
            offset += itemCount

            for(var stored of stateStored){
                if(stateList.includes(stored.country.code + "-" + stored.code) == false){
                    console.log(stored.country.code, stored.code, "disabled")
                    await strapi.service(state_db).update( stored.id, {data : { isIncluded : false }});
                }
            }
            
        }
    }

}))
