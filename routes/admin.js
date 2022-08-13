const express = require('express');

const router = express.Router();

const adminController = require('../controllers/admin');

const isAuthAdmin = require('../middlewares/isAuthAdmin');

router.put('/signup', adminController.signup);

router.post('/verify', adminController.verify);

router.post('/login', adminController.login);

router.post('/resendverification', adminController.resendVerification);

router.patch('/forgotpassword', adminController.forgotPassword);

router.patch('/resetpassword', adminController.resetPassword);

router.post('/createproduct', isAuthAdmin, adminController.createProduct);

router.get('/product-detail/:productId', adminController.getProduct);

router.post('/editproduct/:productId', adminController.editProduct);

router.delete('/deleteproduct/:productId', adminController.deleteProduct);

module.exports = router;