const express = require('express');

const router = express.Router();

const customerController = require('../controllers/customer');

const isAuthCustomer = require('../middlewares/isAuthCustomer');

router.put('/signup', customerController.signup);

router.post('/verify', customerController.verify);

router.post('/login', customerController.login);

router.post('/resendcode', customerController.resendVerificationCode);

router.patch('/forgotpassword', customerController.forgotPassword);

router.patch('/resetpassword', customerController.resetPassword);

router.post('/addtocart/:productId', isAuthCustomer, customerController.addToCart);

router.post('/increaseproduct/:productId', isAuthCustomer, customerController.increaseCartItem);





module.exports = router;