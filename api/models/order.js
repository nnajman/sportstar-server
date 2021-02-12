const mongoose = require('mongoose');

const orderSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    address: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    email: { type: String, required: true ,    
             match: /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/ },
    products: { type: Array, 
                product: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Product'},            
                size: { type: String ,unique: true},
                quantity: { type: Number },
                price: { type: Number, required: true }
            },
    dateCreated: { type: Date, required: true}
});

module.exports = mongoose.model('Order', orderSchema);
