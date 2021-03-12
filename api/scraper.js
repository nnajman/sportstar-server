let axios = require('axios');
let cheerio = require('cheerio');
const mongoose = require("mongoose");
const Product = require("./models/product");

const scrape = async (res) => {
    for (let i = 2; i < 7; i++) {
        const page = await axios.get(`https://runrepeat.com/catalog/adidas-sneakers?page=${i}`)    
        const $ = cheerio.load(page.data);    
        $('ol.rankings_list').each(function () {
            $('li.row', this).each(function(){
                const row = $(this);
                let name = row.find('.product-name').text();
                let imgUrl = row.find('.product-image img')[0].attribs['src'] ? row.find('.product-image img')[0].attribs['src'] : row.find('.product-image img')[0].attribs['data-src'];
                let product = {
                    name: name,
                    brand: 'scrape',
                    image: imgUrl ? imgUrl : 'uploads/products/1614435506567-robot.png',
                    stock: [],
                    price: 999,
                    category : '603a54b22ff97741a8b54d80',
                    dateAdded : Date.now()
                };

                scrapeCreateProduct(product);
            });        
    });
        
    }
    
};

const scrapeCreateProduct = async (productScrape) => {

      productScrape._id = new mongoose.Types.ObjectId();
      
      const product = new Product(productScrape);

      return await product.save();
};

module.exports = {
    scrape
};