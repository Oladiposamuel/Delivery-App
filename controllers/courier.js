const fs = require('fs');
const mongodb = require('mongodb');
const ObjectId = mongodb.ObjectId;
const Courier = require('../models/courier');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const Order = require('../models/order');


let transport = nodemailer.createTransport({
    host: "smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: "6c3ee6256b17ec",
      pass: "70bc488aaac9a7"
    }
});

exports.signup = async (req, res, next) => {
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const email = req.body.email;
    const password = req.body.password;

    let salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);

    try {
        const courier = new Courier(firstName, lastName, email, hashPassword);
        const savedCourierDetailsCheck = await Courier.findCourier(email);
        if (savedCourierDetailsCheck) {
            const error = new Error('Courier exists already!');
            error.statusCode = 400;
            throw error;
        }
        const savedCourier =  await courier.save();
        const savedCourierDetails = await Courier.findCourier(email);

        console.log(savedCourierDetails);

        const verificationToken = jwt.sign({
            email: savedCourierDetails.email,
            userId: savedCourierDetails._id,
        },
        'courierverificationsecretprivatekey',
        {expiresIn: '1h'}
        )

        const url = `http://localhost:8080/courier/verify`;

        transport.sendMail({
            to: email,
            subject: 'Verify Account',
            html: `Click <a href = '${url}'>here</a> to confirm your email. Link expires in an hour.`
        })

        res.status(201).send({message: `Sent a verification email to ${email}`, url: url, verificationToken: verificationToken});

    } catch(error) {
        next(error);
    }
}

exports.verify = async (req, res, next) => {
   
    const AuthHeader = req.get('Authorization');
    //console.log(AuthHeader);

    if(!AuthHeader) {
        const error = new Error('Not authenticated');
        throw error;
    }

    const token = AuthHeader.split(' ')[1];

    try {
        decodedToken = jwt.verify(token, 'courierverificationsecretprivatekey')
        console.log(decodedToken);
    } catch(error) {
        throw error;
    }

    if (!decodedToken) {
        const error = new Error('Not authenticated');
        error.statusCode = 401;
        throw error; 
    }

    try {
        //console.log(userData);
        const courier = await Courier.findCourier(decodedToken.email);
        console.log(courier);
        const id = courier._id;
        if (!courier ) {
            return res.status(404).send({message: "Courier not found!"});
        }
        
        const updatedCourier = await Courier.updateCourierVerification(id);

        res.status(201).send({message: "Account verified", updatedCourier: updatedCourier});
    } catch (error) {
        next(error);
    }
}

exports.login = async (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;

    try {
        const savedCourier = await Courier.findCourier(email);
        if (!savedCourier) {
            return res.status(404).send('Courier not found! Please sign up.');
        }
 
        const checkPassword = bcrypt.compareSync(password, savedCourier.password); // true
        console.log(checkPassword);
        if(!checkPassword) {
            const error = new Error('Wrong password!')
            error.statusCode = 401;
            throw error;
        }

        const token = jwt.sign({
            email: savedCourier.email,
            userId: savedCourier._id,
        },
        'couriersecretprivatekey',
        {expiresIn: '10h'}
        )
        
        res.status(200).send({message: 'Logged in!', token: token, courier: savedCourier});

    } catch(error) {
        next(error);
    }
}

exports.resendVerification = async (req, res, next) => {

    const AuthHeader = req.get('Authorization');
    //console.log(AuthHeader);

    if(!AuthHeader) {
        const error = new Error('Not authenticated');
        throw error;
    }

    const token = AuthHeader.split(' ')[1];

    try {
        decodedToken = jwt.verify(token, 'courierverificationsecretprivatekey')
        console.log(decodedToken);
    } catch(error) {
        throw error;
    }

    if (!decodedToken) {
        const error = new Error('Not authenticated');
        error.statusCode = 401;
        throw error; 
    }

    try {
        const url = `http://localhost:8080/courier/verify`;

        transport.sendMail({
            to: decodedToken.email,
            subject: 'Verify Account',
            html: `Click <a href = '${url}'>here</a> to confirm your email. Link expires in an hour.`
        })

        res.status(201).send({message: `Sent a verification email to ${decodedToken.email}`, url: url});
    } catch(error) {
        next(error);
    }
}

exports.forgotPassword = async (req, res, next) => {
    const email = req.body.email;

    const savedCourier = await Courier.findCourier(email);
    

    if(!savedCourier) {
        res.status(404).send('Courier not found!');
    } else {
        const token = jwt.sign({
            email: savedCourier.email,
            userId: savedCourier._id,
        },
        'forgotcourierpasswordsecretprivatekey',
        //{expiresIn: '1h'}
        )
        res.status(200).send({message: 'Courier exists!', token: token});
    }
}

exports.resetPassword  = async (req, res, next) => {
    const AuthHeader = req.get('Authorization');

    if(!AuthHeader) {
        const error = new Error('Not authenticated');
        throw error;
    }

    const token = AuthHeader.split(' ')[1];

    try {
        decodedToken = jwt.verify(token, 'forgotcourierpasswordsecretprivatekey')
        console.log(decodedToken);
    } catch(error) {
        throw error;
    }

    if (!decodedToken) {
        const error = new Error('Not authenticated');
        error.statusCode = 401;
        throw error; 
    }

    const oldPassword = req.body.oldPassword;
    const newPassword = req.body.newPassword;

    const userId = ObjectId(decodedToken.userId);

    try {
        const savedCourier= await Courier.findCourierById(userId);

        const checkPassword = bcrypt.compareSync(oldPassword, savedCourier.password); 
        console.log(checkPassword);
        if(!checkPassword) {
            const error = new Error('Wrong old password!')
            error.statusCode = 401;
            throw error;
        }

        if(oldPassword === newPassword) {
            const error = new Error('New password can not be the same with old password. Enter new password.');
            error.statusCode = 400;
            throw error;
        }

        let salt = await bcrypt.genSalt(10);
        const hashNewPassword = await bcrypt.hash(newPassword, salt);
        const newSavedCourier = await Courier.updatePassword(userId, hashNewPassword);

        res.status(201).send({message: 'Password has been reset!', oldPassword: oldPassword, newPassword: newPassword, newSavedCourier: newSavedCourier});
    } catch (error) {
        next(error);
    }
}

exports.checkForOrder = async (req, res, next) => {
    const unDeliveredOrders = await Order.findUnDeliveredOrder();

    if (unDeliveredOrders) {
        res.status(200).send({message: 'Orders available', orders: unDeliveredOrders});
    } else {
        res.status(404).send({message: 'Orders not available'});
    }
}

exports.getOrderDetails = async (req, res, next) => {
    const orderId = req.query.params;

    const savedOrderDetails = Order.findById(orderId);

    if (savedOrderDetails) {
        res.status(200).send({message: 'Order exists!', order: savedOrderDetails});
    } else {
        res.status(404).send({message: 'Order not found!'});
    }
}

exports.acceptOrder = async (req, res, next) => {
    
}