const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

router.post('/payment/create', paymentController.createCheckoutSession);
router.post('/payment/callback', paymentController.verifyPayment);

module.exports = router;
