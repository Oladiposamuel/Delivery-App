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

router.patch('/increaseproduct/:productId', isAuthCustomer, customerController.increaseCartItem);

router.patch('/decreaseproduct/:productId', isAuthCustomer, customerController.decreaseCartItem);

router.get('/createorder', isAuthCustomer, customerController.createOrder);

router.get('/payfororder/:orderId', isAuthCustomer, customerController.payForOrder);



module.exports = router;