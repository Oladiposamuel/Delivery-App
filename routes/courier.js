const express = require('express');

const { check, body } = require('express-validator');

const router = express.Router();

const courierController = require('../controllers/courier');

const isAuthCourier = require('../middlewares/isAuthCourier');

const Courier = require('../models/courier');

router.put(
    '/signup',
    [
        check('email').isEmail().withMessage('Enter a valid email')
            .custom( async(value, {req}) => {
                const savedCourierDetailsCheck = await Courier.findCourier(value);

                if (savedCourierDetailsCheck) {
                    const error = new Error('Courier exists already!');
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
    courierController.signup);

router.get('/verify', courierController.verify);

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
    courierController.login); 

router.post('/resendverification', courierController.resendVerification);

router.patch('/forgotpassword', courierController.forgotPassword);

router.patch('/resetpassword', courierController.resetPassword);

router.get('/checkfororder', isAuthCourier, courierController.checkForOrder);

router.get('/getorderdetails/:orderId', isAuthCourier, courierController.getOrderDetails);

router.patch('/acceptorder/:orderId', isAuthCourier, courierController.acceptOrder);

router.patch('/rejectorder/:orderId', isAuthCourier, courierController.rejectOrder);

router.patch('/completeorder/:orderId', isAuthCourier, courierController.completedOrder);

module.exports = router;