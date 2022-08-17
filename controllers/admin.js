const fs = require('fs');
const mongodb = require('mongodb');
const ObjectId = mongodb.ObjectId;
const Admin =  require('../models/admin');
const Product = require('../models/product');
const Category = require('../models/category');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');

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
        const admin = new Admin(firstName, lastName, email, hashPassword);
        const savedAdminDetailsCheck = await Admin.findAdmin(email);
        if (savedAdminDetailsCheck) {
            const error = new Error('Admin exists already!');
            error.statusCode = 400;
            throw error;
        }
        const savedAdmin =  await admin.save();
        const savedAdminDetails = await Admin.findAdmin(email);

        console.log(savedAdminDetails);

        const verificationToken = jwt.sign({
            email: savedAdminDetails.email,
            userId: savedAdminDetails._id,
        },
        'adminverificationsecretprivatekey',
        {expiresIn: '1h'}
        )

        const url = `http://localhost:8080/verify`;

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
        decodedToken = jwt.verify(token, 'adminverificationsecretprivatekey')
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
        const admin = await Admin.findAdmin(decodedToken.email);
        console.log(admin);
        const id = admin._id;
        if (!admin ) {
            return res.status(404).send({message: "Admin not found!"});
        }
        
        const updatedAdmin = await Admin.updateAdminVerification(id);

        res.status(201).send({message: "Account verified", updatedAdmin: updatedAdmin});
    } catch (error) {
        next(error);
    }
}

exports.login = async (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;

    try {
        const savedAdmin = await Admin.findAdmin(email);
        if (!savedAdmin) {
            return res.status(404).send('Admin not found! Please sign up.');
        }
 
        const checkPassword = bcrypt.compareSync(password, savedAdmin.password); // true
        console.log(checkPassword);
        if(!checkPassword) {
            const error = new Error('Wrong password!')
            error.statusCode = 401;
            throw error;
        }

        const token = jwt.sign({
            email: savedAdmin.email,
            userId: savedAdmin._id,
        },
        'adminsecretprivatekey',
        {expiresIn: '1h'}
        )
        
        res.status(200).send({message: 'Logged in!', token: token, admin: savedAdmin});

    } catch(error) {
        next(error);
    }
}

exports. resendVerification = async (req, res, next) => {

    const AuthHeader = req.get('Authorization');
    //console.log(AuthHeader);

    if(!AuthHeader) {
        const error = new Error('Not authenticated');
        throw error;
    }

    const token = AuthHeader.split(' ')[1];

    try {
        decodedToken = jwt.verify(token, 'adminverificationsecretprivatekey')
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
        const url = `http://localhost:8080/verify`;

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

    const savedAdmin = await Admin.findAdmin(email);
    

    if(!savedAdmin) {
        res.status(404).send('Admin not found!');
    } else {
        const token = jwt.sign({
            email: savedAdmin.email,
            userId: savedAdmin._id,
        },
        'forgotadminpasswordsecretprivatekey',
        //{expiresIn: '1h'}
        )
        res.status(200).send({message: 'Admin exists!', token: token});
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
        decodedToken = jwt.verify(token, 'forgotadminpasswordsecretprivatekey')
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
        const savedAdmin= await Admin.findAdminById(userId);

        const checkPassword = bcrypt.compareSync(oldPassword, savedAdmin.password); 
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
        const newSavedAdmin = await Admin.updatePassword(userId, hashNewPassword);

        res.status(201).send({message: 'Password has been reset!', oldPassword: oldPassword, newPassword: newPassword, newSavedAdmin: newSavedAdmin});
    } catch (error) {
        next(error);
    }
}

exports.createProduct =  async (req, res, next) => {
    const image = req.file;
    const title = req.body.title;
    const price = parseFloat(req.body.price);
    const description = req.body.description;
    const quantity = parseFloat(req.body.quantity);
    const categoryName = req.body.category;
    const adminId = ObjectId(req.adminId); 

    console.log(image);
    const imagePath = image.path;

    try {
        const savedProduct = await Product.findProduct(title);
        
        if (savedProduct) {
            const quantity = savedProduct.quantity + 1;
            const title = savedProduct.title;
            const updatedProduct = await Product.updateQuantity(quantity, title);
            res.status(201).send({message: 'Product created already! Product quantity increased by 1'});
        } else {

            const savedCategoryCheck = await Category.findCategory(categoryName);

            if(!savedCategoryCheck) {
                const category = new Category(categoryName);
                const savedCategory = await category.save();
            }

            const product = new Product(imagePath, title, price, description, quantity, categoryName, adminId);
            const savedProduct = await product.save();
            res.status(201).send({message: 'Product created!'});
        }
    } catch (error) {
        next(error);
    }
}

exports.getProduct = async (req, res, next) => {
    const prodId = ObjectId(req.params.productId);

    try { 
        const productDetail = await Product.findProductById(prodId);

        res.send({message: 'Product Detail!', productDetail: productDetail});
    } catch(error) {
        next(error);
    }
}

exports.editProduct = async (req, res, next) => {
    const prodId = ObjectId(req.params.productId);

    const updatedImage = req.file;
    const updatedTitle = req.body.title;
    const updatedPrice = req.body.price;
    const updatedDescription = req.body.description;
    const updatedQuantity = parseFloat(req.body.quantity);
    const updatedCategoryName = req.body.category;
    const adminId = ObjectId(req.adminId);

    const updatedImagePath = updatedImage.path;

    const savedCategoryCheck = await Category.findCategory(updatedCategoryName);

    if (!savedCategoryCheck) {
        const category = new Category(updatedCategoryName);
        const savedCategory = await category.save();
    }

    const savedProduct = await Product.findProductById(prodId);

    try {
        const product = new Product(updatedImagePath, updatedTitle, updatedPrice, updatedDescription, updatedQuantity, updatedCategoryName, adminId);
        const editedSavedProduct = await product.edit(prodId);
        console.log(editedSavedProduct);

        if (editedSavedProduct.modifiedCount == 0 ) {
            fs.unlink(updatedImagePath, (error) => {
                if (error) {
                    throw error;
                } else {
                    console.log('Image file deleted!');
                }
            })
        }

        if(editedSavedProduct.modifiedCount == 1) {
            fs.unlink(savedProduct.image, (error) => {
                if (error) {
                    throw error;
                } else {
                    console.log('Image file deleted!');
                }
            })
        }

        res.status(201).send({message: 'Product edited!'});
    } catch(error) {
        next(error);
    }
}

exports.deleteProduct = async (req, res, next) => {
    const prodId = ObjectId(req.params.productId);

    try {
        const savedProduct = await Product.findProductById(prodId);

        //console.log(savedProduct);

        const imagePath = savedProduct.image;

        fs.unlink(imagePath, (error) => {
            if (error) {
                throw error;
            } else {
                console.log('Image file deleted!');
            }
        })

        await Product.deleteProduct(prodId);

        res.send({message: 'Product deleted!'});
    } catch(error) {
        next(error);
    }
}