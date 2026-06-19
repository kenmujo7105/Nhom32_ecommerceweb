const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { verifyToken, optionalAuth, isAdmin } = require('../middleware/auth');

// Validation rules
const orderValidation = [
  body('customer_name').notEmpty().withMessage('Customer name is required').trim(),
  body('customer_email').isEmail().withMessage('Valid customer email is required').trim(),
  body('customer_phone').notEmpty().withMessage('Customer phone is required').trim(),
  body('customer_address').notEmpty().withMessage('Customer address is required').trim(),
  body('items').isArray({ min: 1 }).withMessage('Order items must be an array with at least one item'),
  body('items.*.product_id').isInt().withMessage('Product ID must be an integer'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1')
];

const statusValidation = [
  body('status').isIn(['pending', 'preparing', 'shipping', 'delivered', 'cancelled', 'completed'])
    .withMessage('Invalid status value')
];

// Guest or Logged-in checkout (optionalAuth)
router.post('/orders', optionalAuth, orderValidation, orderController.createOrder);

// Logged-in User routes
router.get('/orders/my', verifyToken, orderController.getMyOrders);
router.patch('/orders/:id/cancel', verifyToken, orderController.cancelMyOrder);

// Admin routes
router.get('/admin/orders', verifyToken, isAdmin, orderController.getAdminOrders);
router.get('/admin/orders/:id', verifyToken, isAdmin, orderController.getAdminOrderById);
router.patch('/admin/orders/:id/status', verifyToken, isAdmin, statusValidation, orderController.updateOrderStatus);

module.exports = router;
