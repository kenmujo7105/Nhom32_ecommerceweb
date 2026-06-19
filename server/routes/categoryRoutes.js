const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { verifyToken, isAdmin } = require('../middleware/auth');

// Validation rules
const categoryValidation = [
  body('name').notEmpty().withMessage('Category name is required').trim(),
  body('slug').notEmpty().withMessage('Category slug is required').matches(/^[a-z0-9-]+$/).withMessage('Slug can only contain lowercase letters, numbers, and hyphens').trim()
];

// Public routes
router.get('/categories', categoryController.getAllCategories);

// Protected Admin routes
router.post('/admin/categories', verifyToken, isAdmin, categoryValidation, categoryController.createCategory);
router.put('/admin/categories/:id', verifyToken, isAdmin, categoryValidation, categoryController.updateCategory);
router.delete('/admin/categories/:id', verifyToken, isAdmin, categoryController.deleteCategory);

module.exports = router;
