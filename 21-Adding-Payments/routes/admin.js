const path = require('path');
const { check, body } = require('express-validator');

const express = require('express');

const adminController = require('../controllers/admin');
const isAuth = require('../middleware/is-auth');

const router = express.Router();

// /admin/add-product => GET
router.get('/add-product', adminController.getAddProduct);

// // /admin/products => GET
router.get('/products', isAuth, adminController.getProducts);

// // /admin/add-product => POST
router.post('/add-product', [
    body('title')
        .isLength({min: 3})
        .trim(),
    body('price').isFloat(),
    body('description')
        .isLength({min: 5, max: 200})
        .trim(),
], isAuth, adminController.postAddProduct);

router.get('/edit-product/:productId', isAuth, adminController.getEditProduct);

router.post('/edit-product', [
    body('title')
        .isLength({min: 3})
        .trim(),
    body('price').isFloat(),
    body('description')
        .isLength({min: 5, max: 200})
        .trim(),
], isAuth, adminController.postEditProduct);

router.delete('/product/:productId', isAuth, adminController.deleteProduct);

module.exports = router;
