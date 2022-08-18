const path = require('path');
const express = require('express');
const dotenv = require('dotenv').config();
const {mongoConnect} = require('./util/database');
const bodyParser = require('body-parser');
const multer = require('multer');
const cors =  require('cors');

const customerRoutes = require('./routes/customer');
const courierRoutes = require('./routes/courier');
const adminRoutes = require('./routes/admin');

const app = express();

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
// app.use('/courier', courierRoutes);
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
