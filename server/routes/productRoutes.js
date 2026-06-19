const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const productController = require('../controllers/productController');
const { verifyToken, isAdmin } = require('../middleware/auth');

// Validation rules
const productValidation = [
  body('category_id').isInt().withMessage('Category ID must be an integer'),
  body('name').notEmpty().withMessage('Product name is required').trim(),
  body('slug').notEmpty().withMessage('Product slug is required').matches(/^[a-z0-9-]+$/).withMessage('Slug can only contain lowercase letters, numbers, and hyphens').trim(),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('sale_price').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('Sale price must be a positive number'),
  body('stock').optional({ nullable: true }).isInt({ min: 0 }).withMessage('Stock must be a non-negative integer')
];

// Public routes
router.get('/products', productController.getAllProducts);
router.get('/products/:id', productController.getProductById);

// Protected Admin routes
router.post('/admin/products', verifyToken, isAdmin, productValidation, productController.createProduct);
router.put('/admin/products/:id', verifyToken, isAdmin, productValidation, productController.updateProduct);
router.delete('/admin/products/:id', verifyToken, isAdmin, productController.deleteProduct);

module.exports = router;
