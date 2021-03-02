const express = require('express');
const router = express.Router();
const checkAuth = require('../middlewares/checkAuth');

const {
    signup,
    login,
    getUsers,
    getUser,
    deleteUser,
    updateUser
} = require('../controllers/users');

router.post('/login', login);

//Admin
router.post('/signup', checkAuth, signup);
router.get('/', checkAuth, getUsers);
router.get('/:userId', checkAuth, getUser);
router.patch('/:userId', checkAuth, updateUser);
router.delete('/:userId', checkAuth, deleteUser);

module.exports = router;