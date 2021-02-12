const mongoose = require('mongoose');
// const stockSchema = mongoose.Schema({
//     size: { type: String ,unique: true},
//     quantity: { type: Number }
// },{ _id : false });

const productSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    name: { type: String, required: true },
    brand: { type: String },
    image: { type: String, required: true},
    price: { type: Number, required: true },
    stock: { type: Array, 
                size: { type: String ,unique: true},
                quantity: { type: Number, min: 0 }
            },
    dateAdded: { type: Date, required: true},
    category: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Category' }
});

module.exports = mongoose.model('Product', productSchema);
