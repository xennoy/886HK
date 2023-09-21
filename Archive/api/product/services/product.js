'use strict';

/**
 * product service
 */

var xl = require('excel4node');
const fs = require('fs')

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::product.product', ({ strapi }) => ({
    async exportExcelProduct(getData) {
        // Create a new instance of a Workbook class
        var wb = new xl.Workbook();

        // Add Worksheets to the workbook
        var ws = wb.addWorksheet('產品列表');

        // Create a reusable style
        var styleFieldName = wb.createStyle({
            fill: {
                type: 'pattern',
                patternType: 'solid',
                bgColor: '#00ddff',
                fgColor: '#00ddff',
            }
        });

        ws.cell(1, 1).string('產品編號').style(styleFieldName)
        ws.cell(1, 2).string('產品名稱').style(styleFieldName)
        ws.cell(1, 3).string('供應商').style(styleFieldName)
        ws.cell(1, 4).string('最新入貨日期').style(styleFieldName)
        ws.cell(1, 5).string('最新入貨時間').style(styleFieldName)
        ws.cell(1, 6).string('最新入貨價錢').style(styleFieldName)
        ws.cell(1, 7).string('最新最低價錢').style(styleFieldName)
        ws.cell(1, 8).string('最新售價').style(styleFieldName)
        ws.cell(1, 9).string('入貨價平均價').style(styleFieldName)
        ws.cell(1, 10).string('倉庫詳情').style(styleFieldName)

        // console.log(getData)
        
        for(var i = 0; i < getData.length; i++){
            console.log(getData[i].attributes)
            if(getData[i].attributes.product_id != null)
                ws.cell(i + 2, 1).string(getData[i].attributes.product_id)
            if(getData[i].attributes.name != null)
                ws.cell(i + 2, 2).string(getData[i].attributes.name)
            if(getData[i].attributes.supplier.data != null && getData[i].attributes.supplier.data.attributes.name != null)
                ws.cell(i + 2, 3).string(getData[i].attributes.supplier.data.attributes.name)
            if(getData[i].attributes.new_restock_date != null){
                var getRestockDate = new Date(getData[i].attributes.new_restock_date)
                let day = ("0" + getRestockDate.getDate()).slice(-2);
                let month = ("0" + (getRestockDate.getMonth() + 1)).slice(-2);
                let year = getRestockDate.getFullYear();
                var restockDate = year + '-' + month + '-' + day

                let hour = ("0" + getRestockDate.getHours()).slice(-2);
                let minute = ("0" + getRestockDate.getMinutes()).slice(-2);
                var restockTime = hour + ':' + minute

                ws.cell(i + 2, 4).date(restockDate)
                ws.cell(i + 2, 5).string(restockTime)
            }
            if(getData[i].attributes.restocks.data.length > 0 && getData[i].attributes.restocks.data[0].attributes.restock_price != null)
                ws.cell(i + 2, 6).number(getData[i].attributes.restocks.data[0].attributes.restock_price)
            if(getData[i].attributes.new_lowest_price != null)
                ws.cell(i + 2, 7).number(getData[i].attributes.new_lowest_price)
            if(getData[i].attributes.new_selling_price != null)
                ws.cell(i + 2, 8).number(getData[i].attributes.new_selling_price)
            if(getData[i].attributes.average_restock_price != null)
                ws.cell(i + 2, 9).number(getData[i].attributes.average_restock_price)
            if(getData[i].attributes.stocks.data.length > 0){
                for(var stockCount = 0; stockCount < getData[i].attributes.stocks.data.length; stockCount ++){
                    var storehouse = getData[i].attributes.stocks.data[stockCount].attributes.storehouse.data.attributes.name
                    var variation = getData[i].attributes.stocks.data[stockCount].attributes.variation.data.attributes.name
                    var quantity = getData[i].attributes.stocks.data[stockCount].attributes.quantity.toString()

                    var stockString = storehouse + " " + variation + " " + quantity

                    ws.cell(i + 2, stockCount + 10).string(stockString)
                }
                
            }
        }

        var currentDate = new Date()
        let day = ("0" + currentDate.getDate()).slice(-2);
        let month = ("0" + (currentDate.getMonth() + 1)).slice(-2);
        let year = currentDate.getFullYear();

        var frontName = year.toString() + month.toString() + day.toString() + '_export_product_list_'

        var count = 0
        fs.readdirSync("public/uploads/").forEach(file => {
            if(file.toString().includes(frontName)){
                count ++
            }
        });

        var backName = ("0" + (count + 1).toString()).slice(-2);

        var fileName = frontName + backName + ".xlsx"
        var path = "public/uploads/" + fileName
        wb.write(path)
        return fileName
    }
}));
