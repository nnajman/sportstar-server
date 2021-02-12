const express = require('express');
const router = express.Router();

//const checkAuth = require('../middlewares/checkAuth');

const {
    getOrders,
    getOrder,
    createOrder,
    deleteOrder,
} = require('../controllers/orders');

router.get('/', getOrders);
router.get('/:orderId', getOrder);

router.post('/' ,createOrder);

//Add checkAuth
// statistic
router.delete('/:orderId', deleteOrder);

module.exports = router;