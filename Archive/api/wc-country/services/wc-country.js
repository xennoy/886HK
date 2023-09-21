'use strict';

/**
 * wc-country service.
 */

const { createCoreService } = require('@strapi/strapi').factories;

async function mkCountry(key,country){
    var country = { 
      code : key,
      name : country["en"],
      translation: country,
      isIncluded : true
    }
    return country
}
async function updateCountry(element,db_name){
    var updated = []
    for (var countryCode in element) {
      const currentResult =  await strapi.db.query(db_name).findOne({where: {code: countryCode }});
      var country= await mkCountry(countryCode, element[countryCode])
  
      if (!(currentResult == null)){
        country.id = currentResult.id
        await strapi.service(db_name).update( currentResult.id, {data : country} );
        
      }else{
        await strapi.service(db_name).create( {data: country} );
      }
      updated.push(countryCode)
    }
    return updated
}

module.exports = createCoreService('api::wc-country.wc-country', ({ strapi }) => ({
    async find(params) {
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
        var wooData = await await strapi.plugin('wordpress').service('wpLink').getCountryStateFromAPI('countries')
        var countryList = await updateCountry( wooData, country_db);

        var nextPage = true
        var offset = 0
        while (nextPage){
            var countryStored = await strapi.db.query(country_db).findMany({limit : setting.maxPerPage, offset : offset, populate: {country:true}})
            var itemCount = countryStored.length
            if (itemCount < setting.maxPerPage){
                /* if item returned is less than max per page ( = last page ) */
                nextPage = false
            }
            offset += itemCount
            
            for(var stored of countryStored){
                if(countryList.includes(stored.code) == false){
                    await strapi.service(country_db).update( stored.id, {data : { isIncluded : false }});
                }
            }
        }
    }
}))
