const express = require('express');
const checkAuth = require('../middlewares/checkAuth');
const router = express.Router();

//const checkAuth = require('../middlewares/checkAuth');

const {
    getOrders,
    getOrder,
    createOrder,
    deleteOrder,
} = require('../controllers/orders');


router.post('/' ,createOrder);

//TODO: statistic
//Admin
router.get('/', checkAuth, getOrders);
router.get('/:orderId', checkAuth, getOrder);
router.delete('/:orderId', checkAuth, deleteOrder);

module.exports = router;