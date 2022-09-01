const express = require('express');

const { check, body } = require('express-validator');

const router = express.Router();

const adminController = require('../controllers/admin');

const isAuthAdmin = require('../middlewares/isAuthAdmin');

const Admin = require('../models/admin');

router.put(
    '/signup',
    [
        check('email').isEmail().withMessage('Enter a valid email')
            .custom( async(value, {req}) => {
                const savedAdminDetailsCheck = await Admin.findAdmin(value);

                if (savedAdminDetailsCheck) {
                    const error = new Error('Admin exists already!');
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
    adminController.signup);

router.post('/verify', adminController.verify);

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
    adminController.login);

router.post('/resendverification', adminController.resendVerification);

router.patch('/forgotpassword', adminController.forgotPassword);

router.patch('/resetpassword', adminController.resetPassword);

router.post('/createproduct', isAuthAdmin, adminController.createProduct);

router.get('/product-detail/:productId', adminController.getProduct);

router.post('/editproduct/:productId', adminController.editProduct);

router.delete('/deleteproduct/:productId', adminController.deleteProduct);

module.exports = router;