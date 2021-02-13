const express = require('express');
const router = express.Router();
const checkAuth = require('../middlewares/checkAuth');

const {
    signup,
    login
} = require('../controllers/users');

router.post('/login', login);

//Admin
router.post('/signup', checkAuth, signup);

module.exports = router;