const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

router.post('/payment/vnpay/create', paymentController.createVNPayUrl);
router.post('/payment/vnpay/callback', paymentController.vnpayReturn);

module.exports = router;
