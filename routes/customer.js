const express = require('express');

const { check, body } = require('express-validator');

const router = express.Router();

const customerController = require('../controllers/customer');

const isAuthCustomer = require('../middlewares/isAuthCustomer');

const Customer = require('../models/customer');

router.put(
    '/signup', 
    [
        check('email').isEmail().withMessage('Enter a valid email')
            .custom( async(value, {req}) => {
                const savedCustomerDetailsCheck = await Customer.findCustomer(value);

                if (savedCustomerDetailsCheck) {
                    const error = new Error('Customer exists already!');
                    error.statusCode = 400;
                    throw error;
                }
            })
            .normalizeEmail()
            .trim(),
        body('password').isLength({min: 5}).withMessage('Enter password with at least 5 texts and numbers characters')
            .isAlphanumeric()
            .trim(),
    ], 
customerController.signup);

router.post('/verify', customerController.verify);

router.post(
    '/login',
    [
        body('email').isEmail().withMessage('Enter a valid email')
            .normalizeEmail()
            .trim(),
        body('password').isLength({min: 5}).withMessage('Wrong password')
            .isAlphanumeric()
            .trim()
    ],
 customerController.login);

router.post('/resendcode', customerController.resendVerificationCode);

router.patch('/forgotpassword', customerController.forgotPassword);

router.patch('/resetpassword', customerController.resetPassword);

router.patch('/addtocart/:productId', isAuthCustomer, customerController.addToCart);

router.patch('/increaseproduct/:productId', isAuthCustomer, customerController.increaseCartItem);

router.patch('/decreaseproduct/:productId', isAuthCustomer, customerController.decreaseCartItem);

router.get('/createorder', isAuthCustomer, customerController.createOrder);

router.get('/payfororder/:orderId', isAuthCustomer, customerController.payForOrder);

router.get('/trackmyorder', isAuthCustomer, customerController.trackMyOrder);



module.exports = router;