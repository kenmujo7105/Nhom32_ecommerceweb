const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, isAdmin } = require('../middleware/auth');

// Validation rules
const updateUserValidation = [
  body('is_active').optional().isBoolean().withMessage('is_active must be a boolean'),
  body('role').optional().isIn(['customer', 'admin']).withMessage('role must be either customer or admin')
];

// Admin routes (all protected by verifyToken and isAdmin)
router.get('/admin/roles', verifyToken, isAdmin, userController.getRoles);
router.get('/admin/users', verifyToken, isAdmin, userController.getUsers);
router.get('/admin/users/:id', verifyToken, isAdmin, userController.getUserById);
router.get('/admin/users/:id/products', verifyToken, isAdmin, userController.getUserPurchasedProducts);
router.patch('/admin/users/:id', verifyToken, isAdmin, updateUserValidation, userController.updateUser);
router.delete('/admin/users/:id', verifyToken, isAdmin, userController.deleteUser);

// Specialized Admin Management Routes
router.post('/admin/admins', verifyToken, isAdmin, [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], userController.createAdmin);
router.put('/admin/admins/:id', verifyToken, isAdmin, [
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], userController.updateAdmin);

module.exports = router;
