const path = require('path');
const express = require('express');
const dotenv = require('dotenv').config();
const {mongoConnect} = require('./util/database');
const bodyParser = require('body-parser');
const multer = require('multer');
const cors =  require('cors');
const passport = require('passport');
const cookieSession = require('cookie-session');
require('./passport');
const jwt = require('jsonwebtoken');

const customerRoutes = require('./routes/customer');
const courierRoutes = require('./routes/courier');
const adminRoutes = require('./routes/admin');
const googleAuth = require('./routes/googleAuth');

const Customer = require('./models/customer');
const Cart = require('./models/cart');

const app = express();

app.use(cookieSession({
  name: 'google-auth-session',
  keys: ['key1', 'key2']
}));

app.use(passport.initialize());

app.use(passport.session());

app.get('/loginwithgoogle', (req, res) => {
  res.send("<button><a href='/auth'>Login With Google</a></button>")
});

// Auth 
app.get('/auth' , passport.authenticate('google', { scope:
  [ 'email', 'profile' ]
}));

// Auth Callback
app.get( '/auth/callback',
  passport.authenticate( 'google', {
      successRedirect: '/auth/callback/success',
      failureRedirect: '/auth/callback/failure'
}));

// Success 
app.get('/auth/callback/success' , async (req , res, next) => {
  if(!req.user)
      res.redirect('/auth/callback/failure');

  console.log(req.user);

  const firstName = req.user.given_name;
  const lastName = req.user.family_name;
  const email = req.user.email;
  const hashPassword = null;
  const phoneNumber = null;

  const googleVerification = req.user.email_verified;

  try {
    const customer = new Customer(firstName, lastName, email, hashPassword, phoneNumber, null);
    const savedCustomerDetailsCheck = await Customer.findCustomer(email);
    if (savedCustomerDetailsCheck) {
      const error = new Error('Customer exists already!');
      error.statusCode = 400;
      throw error;                        
    }
    const savedCustomer = await customer.save();
    //console.log(savedCustomer);
    const savedCustomerDetails = await Customer.findCustomer(email);

    const cart = new Cart(savedCustomerDetails._id);
    const savedCart = await cart.save();
    const savedCartId = await Cart.findByCustomerId(savedCustomerDetails._id);
    const updatedCustomerDetails = await Customer.updateCartId(savedCustomerDetails._id, savedCartId._id);

    const updatedSavedCustomerDetails = await Customer.findCustomer(email);
    const id = updatedSavedCustomerDetails._id;     
    console.log(id);

    if(googleVerification) {
      await Customer.updateCustomerVerification(id);

      const token = jwt.sign({
        email: savedCustomer.email,
        userId: savedCustomer._id,
        cartId: savedCustomer.cartId
      },
      'customersecretprivatekey',
      {expiresIn: '10h'}
      )
    
      res.status(200).send({message: 'Logged in!', token: token, customer: savedCustomer});

    } else {
      const error = new Error('Sign in failed! Mail in google account not veririfed');
      error.statusCode = 500;
      throw error;
    }

  } catch(error) {
    next(error);
  }

  //res.send("Welcome " + req.user.email);
});

// failure
app.get('/auth/callback/failure' , (req , res) => {
  res.send("Error");
})

const corsOptions = {
  origin: '*',
  credentials: true,
  optionSuccessStatus: 200,
}
app.use(cors(corsOptions));

app.use(bodyParser.urlencoded({ extended: false }));

app.use(bodyParser.json());

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'images')
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
      cb(null, file.fieldname + '-' + uniqueSuffix + file.originalname);
    }
  });
  
const fileFilter = (req, file, cb) => {
    if (
      file.mimetype === 'image/png' ||
      file.mimetype === 'image/jpg' ||
      file.mimetype === 'image/jpeg' 
    ) {
      cb(null, true);
    } else {
      cb(null, false);
    }
};

app.use(multer({ storage: fileStorage, fileFilter: fileFilter }).single('image'));

app.use('/images', express.static(path.join(__dirname, 'images')));


app.use('/customer', customerRoutes );
app.use('/courier', courierRoutes);
app.use('/admin', adminRoutes);


app.use((error, req, res, next) => {
    const errorMessage = error.message || "Something went wrong";
    const errorStatus = error.statusCode || 500;
    return res.status(errorStatus).json({
        error: errorMessage,
        status: errorStatus,
        stack: error.stack,
        success: false,
    })
})

mongoConnect(() => {
    app.listen(process.env.PORT || 8080, () => {
        console.log('Server is running!');
    })
})
