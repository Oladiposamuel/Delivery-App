const express = require('express');

const router = express.Router();

const customerController = require("../controllers/customer");

router.get('/', customerController.loginWithGoogle);

module.exports = router;