const express = require('express');

const router = express.Router();

const authController = require('../controllers/customer');

router.put('/signup', authController.signup);

router.post('/verify', authController.verify);

router.post('/login', authController.login);

router.post('/resendcode', authController.resendVerificationCode);

router.patch('/forgotpassword', authController.forgotPassword);

router.patch('/resetpassword', authController.resetPassword);



module.exports = router;