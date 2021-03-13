const mongoose = require("mongoose");
const Order = require("../models/order");
const Product = require("../models/product");
const emitterFile = require('../../eventEmitter');
myEmitter = emitterFile.emitter;

module.exports = {
    getOrders: (req, res) => {
      const {
        firstName,
        lastName,
        address,
        phoneNumber,
        email
      } = req.query;
      let fnameRegExp, lnameRegExp, addressRegExp, phoneNumberRegExp, emailRegExp;
  
      // Check if get params and build the regular expressions
      firstName ? (fnameRegExp = `^${firstName}$`) : (fnameRegExp = "");
      lastName ? (lnameRegExp = `^${lastName}$`) : (lnameRegExp = "");
      address ?  (addressRegExp = `${address}`) : (addressRegExp = "");
      phoneNumber ? (phoneNumberRegExp = `${phoneNumber}`) : (phoneNumberRegExp = "");
      email ? (emailRegExp = `${email}`) : (emailRegExp = "");

      Order.find({
        $and: [
          { firstName: new RegExp(fnameRegExp, "i") },
          { lastName: new RegExp(lnameRegExp, "i") },
          { address: new RegExp(addressRegExp, "i") },
          { phoneNumber: new RegExp(phoneNumberRegExp, "i") },
          { email: new RegExp(emailRegExp, "i") },
        ],
      })
        .populate({
            path: 'products.product',
            model: 'Product',
            populate: {
              path: 'category',
              model: 'Category'
            }
        })
            
        .then((orders) => {
          res.status(200).json({
            orders,
          });
        })
        .catch((error) => {
          res.status(500).json({
            error,
          });
        });
    },
    getOrder: (req, res) => {
      const orderId = req.params.orderId;
  
      Order.findById(orderId)
        .populate("product")
        .then((order) => {
          res.status(200).json({
            order,
          });
        })
        .catch((error) => {
          res.status(500).json({
            error,
          });
        });
    },
    createOrder: async (req, res) => {
      const { firstName, lastName, address, phoneNumber, email, products } = req.body;
      const session = await mongoose.startSession();
      session.startTransaction();

      // Check if not given productId or it is not a valid ObjectId
      // then check if product_id exist
      for (let i = 0; i < products.length; i++) {
        let product = products[i];
        if (!product.product || !mongoose.Types.ObjectId.isValid(product.product)) {
            await session.abortTransaction();
            session.endSession();
            return res.status(500).json({
              message: "Please give valid product_id",
            });
        }
        let mongoProduct = await Product.findById(product.product).session(session);
        if (!mongoProduct) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({
            message: "Product not found",
            });
        }
        else{
            let productSize = mongoProduct.stock.find(s=>s.size == product.size);
            if (!productSize) {     
                await session.abortTransaction();
                session.endSession();
                return res.status(500).json({
                message: `Product has not the request size: ${product.size}`,
                });
            }
            if (productSize.quantity - product.quantity < 0 ) {
                await session.abortTransaction();
                session.endSession();
                return res.status(500).json({
                    message: `Product has not the request quantity: ${product.quantity}, in size: ${product.size}`,
                    });
            }
            mongoProduct.stock.find(s=>s.size == product.size).quantity -= product.quantity
            mongoProduct.markModified('stock');
            await mongoProduct.save().catch(async (error) => {
                await session.abortTransaction();
                session.endSession();
                return res.status(500).json({
                    error,
                });
            });
        }     
      } 

        const order = new Order({
            _id: new mongoose.Types.ObjectId(),
            firstName,
            lastName,
            address,
            phoneNumber,
            email,
            products: products,
            dateCreated: Date.now()
        });
        Order.create([order],{session: session})
            .then(async () => {
              await session.commitTransaction();
              myEmitter.emit('orderAdded');
              res.status(200).json({
                message: "Created order",
              });
            })
            .catch(async (error) => {
              await session.abortTransaction();
              res.status(500).json({
                error,
              });
            })
            .finally(()=>{
                session.endSession();
            });
    },
    deleteOrder: async (req, res) => {
    const orderId = req.params.orderId;

    // Check if not given orderId or it is not a valid ObjectId
    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(500).json({
        message: "Please give a valid orderId",
      });
    }
    
    const session = await mongoose.startSession();
    session.startTransaction();
    
    Order.findById(orderId)
      .then(async (order) => {
        if (!order) {
          await session.abortTransaction();
          session.endSession();
          return res.status(404).json({
            message: "Order not found",
          });
        }

        for (let i = 0; i < order.products.length; i++) {
            let product = order.products[i];
            let mongoProduct = await Product.findById(product.product).session(session);
            if (!mongoProduct) {
                await session.abortTransaction();
                session.endSession();
                return res.status(404).json({
                message: "Product not found",
                });
            }
            else{
                mongoProduct.stock.find(s=>s.size == product.size).quantity += product.quantity
                mongoProduct.markModified('stock');
                await mongoProduct.save().catch(async (error) => {
                    await session.abortTransaction();
                    session.endSession();
                    return res.status(500).json({
                        error,
                    });
                });
            }
        }

        Order.deleteOne({ _id: orderId })
          .then(async () => {
            await session.commitTransaction();
            res.status(200).json({
              message: `Order _id:${orderId} Deleted`,
            });
          })
          .catch(async (error) => {
            await session.abortTransaction();
            session.endSession();
            res.status(500).json({
              error,
            });
          });
      })
      .catch(async (error) => {
        await session.abortTransaction();
        session.endSession();
        res.status(500).json({
          error,
        });
      })
      .finally(()=>{
        session.endSession();
      });
    },
    getOrderPerDate: (req, res) => {
      Order.aggregate([
        {
           $group: {
           _id : { $dateToString: {format: "%d-%m-%Y", date : "$dateCreated"} },
           totalOrders: { $sum: 1 } 
          }
        }
      ])
      .then((ordersPerDate) => {
        res.status(200).json({
          ordersPerDate,
        });
      })
      .catch((error) => {
        res.status(500).json({
          error,
        });
      });
    }
}
  
        