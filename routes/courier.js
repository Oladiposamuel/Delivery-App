const express = require('express');

const router = express.Router();

const courierController = require('../controllers/courier');

const isAuthCourier = require('../middlewares/isAuthCourier');

router.put('/signup', courierController.signup);

router.get('/verify', courierController.verify);

router.post('/login', courierController.login);

router.post('/resendverification', courierController.resendVerification);

router.patch('/forgotpassword', courierController.forgotPassword);

router.patch('/resetpassword', courierController.resetPassword);

router.get('/checkfororder', isAuthCourier, courierController.checkForOrder);

router.get('/getorderdetails/:orderId', isAuthCourier, courierController.getOrderDetails);

router.post('/acceptorder', isAuthCourier, courierController.acceptOrder);

module.exports = router;