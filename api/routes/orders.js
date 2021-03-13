const express = require('express');
const checkAuth = require('../middlewares/checkAuth');
const router = express.Router();

//const checkAuth = require('../middlewares/checkAuth');

const {
    getOrders,
    getOrder,
    createOrder,
    deleteOrder,
    getOrderPerDate,
    getProductsOrder
} = require('../controllers/orders');


router.post('/' ,createOrder);

//Admin
router.get('/', checkAuth, getOrders);
router.get('/:orderId', checkAuth, getOrder);
router.delete('/:orderId', checkAuth, deleteOrder);
//Statistics
router.get('/statistics/orderPerDate', checkAuth, getOrderPerDate);
router.get('/statistics/orderPerProducts', getProductsOrder);


module.exports = router;