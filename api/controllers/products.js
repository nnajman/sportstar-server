const mongoose = require("mongoose");
const Product = require("../models/product");
const Category = require("../models/category");
const fs = require("fs");
const { scrape } = require("../scraper");


function groupBy(key) {
  return function group(array) {
    let newArr = [];
    const values = array
      .map((a) => a[key])
      .filter((v, i, a) => a.indexOf(v) === i);
    values.forEach((value) => {
      newArr.push({
        [key]: value,
        quantity: array
          .filter((a) => a[key] === value)
          .map((a) => a.quantity)
          .reduce((sum, b) => sum + b),
      });
    });
    return newArr;
  };
}

const groupBySize = groupBy("size");

// Delete product image
function deleteProductImage(productImage) {
  fs.unlink(productImage, (err) => {
    if (err) console.log(err);
    else {
      console.log("Product Image Deleted");
    }
  });
}

module.exports = {
  getProducts: (req, res) => {
    const {
      name,
      brands,
      minPrice = 0,
      maxPrice = 9999999,
      categoryId,
    } = req.query;
    let { sizes } = req.query;
    let nameRegExp;
    let categoryIdCriteria = {}, sizesCriteria = {}, brandsCriteria = {};

    // Check if get name param and build the regular expressions
    name ? (nameRegExp = `${name}`) : (nameRegExp = "");

    // Check if categoryId is a valid ObjectId than create criteria of it
    // else check if categoryId is defined than return empty products
    if (mongoose.Types.ObjectId.isValid(categoryId)) {
      categoryIdCriteria = { category: categoryId };
    }
     else if (categoryId && categoryId != "blank") {
      return res.status(200).json({
        products: [],
      });
    }

    if (brands) {
      brandsCriteria = { brand: {$in: brands} };
    }

    if (sizes) {
      if (typeof(sizes) == 'string') {
        sizes = [sizes];
      }
      sizesCriteria = { stock: { $elemMatch: { size: { $in: sizes }, quantity: { $gt: 0 } } } };
    }

    Product.find({
      $and: [
        { name: new RegExp(nameRegExp, "i") },
        brandsCriteria,
        sizesCriteria,
        { price: { $gte: minPrice } },
        { price: { $lte: maxPrice } },
        categoryIdCriteria,
      ],
    })
      .populate("category")
      .then((products) => {
        if (categoryId == "blank") {
          products = products.filter((p)=>!p.category)
        }
        res.status(200).json({
          products,
        });
      })
      .catch((error) => {
        res.status(500).json({
          error,
        });
      });
  },
  getProduct: (req, res) => {
    const productId = req.params.productId;

    Product.findById(productId)
      .populate("category")
      .then((product) => {
        res.status(200).json({
          product,
        });
      })
      .catch((error) => {
        res.status(500).json({
          error,
        });
      });
  },
  createProduct: (req, res) => {
    const { path: image } = req.file;
    const { name, brand, stock, price, categoryId } = req.body;

    // Check if not given categoryId or it is not a valid ObjectId
    if (!categoryId || !mongoose.Types.ObjectId.isValid(categoryId)) {
      deleteProductImage(image);
      return res.status(500).json({
        message: "Please give valid categoryId",
      });
    }

    Category.findById(categoryId).then((category) => {
      if (!category) {
        deleteProductImage(image);
        return res.status(404).json({
          message: "Category not found",
        });
      }

      req.body.stock = JSON.parse(req.body.stock);
      
      // For working with postman (postman send quantity as string)
      req.body.stock.forEach((s) => {
        s.quantity = Number(s.quantity);
      });

      // Merge all equal size
      let stockDistinctSize = groupBySize(req.body.stock);

      const product = new Product({
        _id: new mongoose.Types.ObjectId(),
        name,
        brand,
        stock: stockDistinctSize,
        image: image.split("\\").join("/"),
        price,
        dateAdded: Date.now(),
        category,
      });

      product
        .save()
        .then(() => {
          res.status(200).json({
            message: "Created product",
          });
        })
        .catch((error) => {
          deleteProductImage(image);
          res.status(500).json({
            error,
          });
        });
    }).catch((error) => {
        deleteProductImage(image);
        res.status(500).json({
          error,
        });
      });;
  },
  updateProduct: (req, res) => {
    const productId = req.params.productId;
    const { categoryId } = req.body;
    let productCurrImage;
    let image;
    
    // Check if upload image to replace current image
    if (req.file) {
      image = req.file.path;
      req.body.image = (image.split("\\").join("/"));
    }

    Product.findById(productId).then((product) => {
      if (!product) {
        // If upload image than delete it
        if (image) {
          deleteProductImage(image);
        }
        return res.status(404).json({
          message: "Product not found",
        });
      }
      // Merge all equal size in stock
      if (req.body.stock) {
        // For working with postman (postman send quantity as string)
        req.body.stock = JSON.parse(req.body.stock);
        req.body.stock.forEach((s) => {
          s.quantity = Number(s.quantity);
        });
        req.body.stock = groupBySize(req.body.stock);
      }

      productCurrImage = product.image;
      // If update category
      if (categoryId) {
        return Category.findById(categoryId).then((category) => {
          if (!category) {
            // If upload image than delete it
            if (image) {
              deleteProductImage(image);
            }
            return res.status(404).json({
              message: "Category not found",
            });
          }
          Product.updateOne({ _id: productId }, req.body)
            .then(() => {
              // Check if replace image than delete old one
              if (image) {
                deleteProductImage(productCurrImage);
              }
              return res.status(200).json({
                message: "Product Updated",
              });
            })
            .catch((error) => {
              // If upload image than delete it
              if (image) {
                deleteProductImage(image);
              }
              res.status(500).json({
                error,
              });
            });
        });
      } else {
        Product.updateOne({ _id: productId }, req.body)
          .then(() => {
            // Check if replace image than delete old one
            if (image) {
              deleteProductImage(productCurrImage);
            }
            res.status(200).json({
              message: "Product Updated",
            });
          })
          .catch((error) => {
            // If upload image than delete it
            if (image) {
              deleteProductImage(image);
            }
            res.status(500).json({
              error,
            });
          });
      }
    });
  },
  deleteProduct: (req, res) => {
    const productId = req.params.productId;
    let productImage;

    // Check if not given productId or it is not a valid ObjectId
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(500).json({
        message: "Please give a valid productId",
      });
    }

    Product.findById(productId)
      .then((product) => {
        if (!product) {
          return res.status(404).json({
            message: "Product not found",
          });
        }
        productImage = product.image;
        Product.deleteOne({ _id: productId })
          .then(() => {
            // Delete product image
            deleteProductImage(productImage);

            res.status(200).json({
              message: `Product _id:${productId} Deleted`,
            });
          })
          .catch((error) => {
            res.status(500).json({
              error,
            });
          });
      })
      .catch((error) => {
        res.status(500).json({
          error,
        });
      });
  },
  getBrands: (req, res) => {
    Product.distinct("brand")
      .then((brands) => {
        res.status(200).json({
          brands,
        });
      })
      .catch((error) => {
        res.status(500).json({
          error,
        });
      });
  },
  getProductsPerBrands: (req, res) => {
    Product.aggregate([
      {
         $group: {
         _id : "$brand" ,
         totalOrders: { $sum: 1 } 
        }
      }
    ])
    .then((productsPerBrand) => {
      res.status(200).json({
        productsPerBrand,
      });
    })
    .catch((error) => {
      res.status(500).json({
        error,
      });
    });
  },
  scrape: (req,res) =>{
    try {
      scrape();
    } catch (error) {
      console.log(error);
    }
    
    res.status(200).json({
      
    });
  }
}