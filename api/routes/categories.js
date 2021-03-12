const express = require('express');
const router = express.Router();
const upload = require('../middlewares/upload');
const checkAuth = require('../middlewares/checkAuth');

const {
    getCategories,
    createCategory,
    getCategory,
    updateCategory,
    deleteCategory
} = require('../controllers/categories');

router.get('/', getCategories);
router.get('/:categoryId', getCategory);

//Admin
router.post('/', checkAuth, upload.uploadCategory.single('image'), createCategory);
router.patch('/:categoryId', checkAuth, upload.uploadCategory.single('image'), updateCategory);
router.delete('/:categoryId', deleteCategory);

module.exports = router;