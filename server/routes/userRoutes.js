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
router.patch('/admin/users/:id', verifyToken, isAdmin, updateUserValidation, userController.updateUser);
router.delete('/admin/users/:id', verifyToken, isAdmin, userController.deleteUser);

module.exports = router;
