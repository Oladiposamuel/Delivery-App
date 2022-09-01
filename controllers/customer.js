const https = require('https');
const dotenv = require('dotenv').config();
const bcrypt = require('bcryptjs');
const Customer = require('../models/customer');
const jwt = require('jsonwebtoken');
const crypto = require('crypto').webcrypto;
const mongodb = require('mongodb');
const axios = require('axios');
const Cart = require('../models/cart');
const Product = require('../models/product');
const Order = require('../models/order');
const ObjectId = mongodb.ObjectId;
const { validationResult } = require('express-validator');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken);


exports.signup = async (req, res, next) => {
    const error = validationResult(req);
    console.log(error);

    if(error.isEmpty()) {
        const firstName = req.body.firstName;
        const lastName = req.body.lastName;
        const email = req.body.email;
        const password = req.body.password;
        const phoneNumber = req.body.phoneNumber;

        let salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(password, salt);

        const array = new BigUint64Array(1);
        const result = crypto.getRandomValues(array);
        const number = result.toString();
        const verificationCode = number.slice(0, 6);

        console.log(verificationCode);
        console.log(verificationCode.length);


        try {
            const customer = new Customer(firstName, lastName, email, hashPassword, phoneNumber, null);
            const savedCustomerDetailsCheck = await Customer.findCustomer(email);   
            // if (savedCustomerDetailsCheck) {
            //     const error = new Error('Customer exists already!');
            //     error.statusCode = 400;
            //     throw error;
            // }
            const savedCustomer = await customer.save();
            const savedCustomerDetails = await Customer.findCustomer(email);

            const cart = new Cart(savedCustomerDetails._id);
            const savedCart = await cart.save();
            const savedCartId = await Cart.findByCustomerId(savedCustomerDetails._id);
            const updatedCustomerDetails = await Customer.updateCartId(savedCustomerDetails._id, savedCartId._id);


            if(savedCustomerDetails) {
            client.messages
            .create({
                body: `Your verifiation code is ${verificationCode}`,
                from: '+15625392194',
                to: phoneNumber
            })
            .then(message => console.log(message.sid));
            }


            const verificationToken = jwt.sign({
                email: savedCustomerDetails.email,
                userId: savedCustomerDetails._id,
                phoneNumber: savedCustomerDetails.phoneNumber,
                code: verificationCode,
            },
            'verificationsecretprivatekey',
            {expiresIn: '1h'}
            )

            res.status(201).send({message: 'You will get your verification code on your device soon. It expires in 1 hour.', verificationToken: verificationToken});
        } catch(error) {
            next(error);
        }
    } else {
        res.status(422).send({message: 'Input validation failed!', error: error.errors[0]});
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

    const verificationCode = req.body.verificationCode;

    if (!verificationCode) {
        return res.send({message: "Enter code"});
    }

    try {
        decodedToken = jwt.verify(token, 'verificationsecretprivatekey')
        console.log(decodedToken);
    } catch(error) {
        throw error;
    }

    if (!decodedToken) {
        const error = new Error('Not authenticated');
        error.statusCode = 401;
        throw error; 
    }

    req.code = decodedToken.code;
    req.userId = decodedToken.userId;

    const id = ObjectId(req.userId)

    if (req.code === verificationCode) {
        const updatedCustomer = await Customer.updateCustomerVerification(id);
        console.log(updatedCustomer);

        res.status(200).send({message: 'Verification successful!'});
    } else {
        res.status(400).send({message: 'Verification unsuccesssful! Enter correct code.'})
    }
}

exports.loginWithGoogle = (req, res) => {
    res.send("<button><a href='/auth'>Login With Google</a></button>");
}

exports.login = async(req, res, next) => {
    const error = validationResult(req);
    console.log(error);
    
    if(error.isEmpty()) {
        const email = req.body.email;
        const password = req.body.password;

        try {
            const savedCustomer = await Customer.findCustomer(email);
            if (!savedCustomer) {
                return res.status(404).send('Customer not found! Please sign up.');
            }

            const checkPassword = bcrypt.compareSync(password, savedCustomer.password); 
            console.log(checkPassword);
            if(!checkPassword) {
                const error = new Error('Wrong password!')
                error.statusCode = 401;
                throw error;
            }

            const token = jwt.sign({
                email: savedCustomer.email,
                userId: savedCustomer._id,
                cartId: savedCustomer.cartId
            },
            'customersecretprivatekey',
            {expiresIn: '10h'}
            )
            
            res.status(200).send({message: 'Logged in!', token: token, customer: savedCustomer});

        } catch(error) {
            next(error);
        }
    } else {
        res.status(422).send({message: 'Input validation failed!', error: error.errors[0]});
    }

}

exports.resendVerificationCode = async (req, res, next) => {

    const array = new BigUint64Array(1);
    const result = crypto.getRandomValues(array);
    const number = result.toString();
    const verificationCode = number.slice(0, 6);

    console.log(verificationCode);
    console.log(verificationCode.length);

    const AuthHeader = req.get('Authorization');

    if(!AuthHeader) {
        const error = new Error('Not authenticated');
        throw error;
    }

    const token = AuthHeader.split(' ')[1];

    try {
        decodedToken = jwt.verify(token, 'verificationsecretprivatekey')
        console.log(decodedToken);
    } catch(error) {
        throw error;
    }

    if (!decodedToken) {
        const error = new Error('Not authenticated');
        error.statusCode = 401;
        throw error; 
    }

    req.code = decodedToken.code;
    req.userId = decodedToken.userId;
    req.phoneNumber = decodedToken.phoneNumber;

        client.messages
        .create({
            body: `Your verifiation code is ${verificationCode}`,
            from: '+15625392194',
            to: req.phoneNumber
        })
        .then(message => {
            console.log(message.sid);
        })
}

exports.forgotPassword = async (req, res, next) => {
    const email = req.body.email;

    const savedCustomer = await Customer.findCustomer(email);
    

    if(!savedCustomer) {
        res.status(404).send('User not found!');
    } else {
        const token = jwt.sign({
            email: savedCustomer.email,
            userId: savedCustomer._id,
        },
        'forgotpasswordsecretprivatekey',
        //{expiresIn: '1h'}
        )
        res.status(200).send({message: 'User exists!', token: token});
    }
}

exports.resetPassword = async (req, res, next) => {
    const AuthHeader = req.get('Authorization');

    if(!AuthHeader) {
        const error = new Error('Not authenticated');
        throw error;
    }

    const token = AuthHeader.split(' ')[1];

    try {
        decodedToken = jwt.verify(token, 'forgotpasswordsecretprivatekey')
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
        const savedCustomer= await Customer.findCustomerById(userId);

        const checkPassword = bcrypt.compareSync(oldPassword, savedCustomer.password); 
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
        const newSavedCustomer = await Customer.updatePassword(userId, hashNewPassword);

        res.status(201).send({message: 'Password has been reset!', oldPassword: oldPassword, newPassword: newPassword});
    } catch (error) {
        next(error);
    }
}

exports.addToCart = async (req, res, next) => {
    const prodId = ObjectId(req.params.productId);
    
    const cartId = ObjectId(req.cartId);
    const customerId = ObjectId(req.customerId);

    try {  
        const savedCustomer = await Customer.findCustomerById(customerId);
        const isVerified = savedCustomer.isVerified;
        if(isVerified === false) {
            const error = new Error('Verify your account!');
            error.statusCode = 401;
            throw error;
        } else {
            const customerCart = await Cart.updateCart(cartId, prodId);

            res.status(201).send({message: 'Product added to cart!'});
        }
    } catch(error) {
        next(error);
    }
}

exports.increaseCartItem = async (req, res, next) => {
    const prodId = ObjectId(req.params.productId);

    const customerId = ObjectId(req.customerId); 
    const cartId = ObjectId(req.cartId);

    try {
        const updatedCart = await Cart.updateCart(cartId, prodId);
        if (!updatedCart) {
            res.status(404).send({message: 'Product not found in cart!'});
        }
        res.status(201).send({message: 'Product quantity increased by 1'});
    } catch(error) {
        next(error);
    }
}

exports.decreaseCartItem = async (req, res, next) => {
    const prodId = ObjectId(req.params.productId);

    const customerId = ObjectId(req.customerId); 
    const cartId = ObjectId(req.cartId);

    try {
        const updatedCart = await Cart.updateCartDec(cartId, prodId);
        if (!updatedCart) {
            res.status(404).send({message: 'Product not found in cart!'});
        }
        res.status(201).send({message: 'Product quantity decreased by 1'});
    } catch(error) {
        next(error);
    }
}

exports.createOrder = async (req, res, next) => {
    const cartId = ObjectId(req.cartId);
    const customerId = ObjectId(req.customerId); 

    const customerCart = await Cart.findById(cartId);
    console.log(customerCart); 

    try {

        const prodDetails = await Promise.all(customerCart.products.map(async (product) => {
            if (!product) {
                const error = new Error('Add products to cart!');
                error.statusCode = 404;
                throw error;
            }
    
            const prodId = product.prodId;
            const prodDetails = await Product.findProductById(prodId);
            return prodDetails;
        }));

        console.log(prodDetails);

        const productsPrice = prodDetails.map(product => {return product.price});

        const productsQuantity = customerCart.products.map(product => {return product.quantity});

        //console.log(productsPrice);
        //console.log(productsQuantity);

        let resultArray = [];

        const totalPrice = () => {
            for (let i = 0; i < Math.min(productsPrice.length, productsQuantity.length); i++) {
                resultArray[i] = productsPrice[i] * productsQuantity[i];
            }
            //console.log(resultArray);

            let total = resultArray.reduce(function(a, b){
                return a + b;
            }, 0);

            return total;
        }

        const totalOrderPrice = totalPrice();

        console.log(totalOrderPrice);

        const order = new Order(customerId, totalOrderPrice, customerCart.products);
        const savedOrderDetails = await order.save();
    
        res.status(200).send({message: 'order created!', orderProducts: prodDetails, order: savedOrderDetails});
    } catch(error) {
        next(error);
    }
}

exports.payForOrder = async (req, res, next) => {
    const orderId = ObjectId(req.params.orderId);
    const customerId = ObjectId(req.customerId);

    try {
        const savedOrder = await Order.findById(orderId);

        const savedCustomer = await Customer.findCustomerById(customerId);

        const email = savedCustomer.email;

        //console.log(savedOrder);

        const totalAmount = savedOrder.totalPrice;

        const params = JSON.stringify({
            "email": email,
            "amount": totalAmount * 100
        })

        const options = {
            hostname: 'api.paystack.co',
            port: 443,
            path: '/transaction/initialize',
            method: 'POST',
            headers: {
              Authorization: 'Bearer sk_test_b579d50e0976f15d6d022c33f3f87573117be2ee',
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache'
            }
        }


        const req = https.request(options, res => {
        let data = ''
        let resData;
        
        res.on('data', (chunk) => {
            data += chunk
        });
        
        res.on('end', (res) => {
            resData = JSON.parse(data);
            //console.log(resData);
            //url = resData.data.authorization_url;
            processData(resData);
        })


        }).on('error', error => {
        console.error(error)
        })
        
        req.write(params)
        req.end()

        //console.log('here');
        const processData = async (resData) => {
            console.log(resData);
            const reference = resData.data.reference;
            let myInterval;
            let stopVerification = false;

                const verifyTransaction = async () => {
                    await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
                        headers: {
                            Authorization: 'Bearer sk_test_b579d50e0976f15d6d022c33f3f87573117be2ee',
                            'Content-Type': 'application/json',
                            'Cache-Control': 'no-cache'
                        }
                    })
                    .then(async(result) => {
                        console.log(result.data);
                            if (result.data.data.gateway_response !== 'Successful') {
                                console.log('hereee');
                                console.log(result.data);
                                start();
                            } else {
                                stop();
                                await Order.orderUpdate(orderId);
                            }
                    })
                    .catch(error => {
                        console.log(error);
                    })
                }
                console.log(stopVerification);
                if (stopVerification !== true) {
                    verifyTransaction();
                    console.log('here');
                } else {
                    return;
                }
                
                const stop = () => {
                    stopVerification = true;
                    clearInterval(myInterval);
                    myInterval = null;
                }

                const start = () => {
                    if (!myInterval) {
                        myInterval =  setInterval(verifyTransaction, 30000);
                    }
                }
                
            
            //setTimeout(verifyTransaction, 60000, reference);

            res.json({message: 'Message!', data: resData});
        }
    } catch(error) {
        next(error);
    }

}

exports.trackMyOrder = async (req, res, next) => {

    // await axios.post(
    //     `https://maps.googleapis.com/maps/api/staticmap?center=Berkeley,CA&zoom=14&size=400x400&key=AIzaSyD7lrgIVzTnYtihlANc4XmE_Ae_B9NAugY`, 
    //     {
    //         headers: {
    //             'Content-Type': 'application/json',
    //             'Cache-Control': 'no-cache'
    //         }
    //     })
    //     .then(result => {
    //         console.log(result);
    //         res.send('request sent!');
    //     })
    //     .catch(error => {
    //         next(error);
    //     })

    mapsClient
    .elevation({ 
        params: {
        locations: [{ lat: 6.537216, lng: 3.3718272 }],
        key: "AIzaSyAjJeeY6yeyh5Di8g_SMco3VFho6-JMFAA",
        },
        timeout: 1000, // milliseconds
    })
    .then((r) => {
        console.log(r.data.results[0].elevation);
        res.send('request sent!');
    })
    .catch((e) => {
        console.log(e.response.data.error_message);
    });

}


