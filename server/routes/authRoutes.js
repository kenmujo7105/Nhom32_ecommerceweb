const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

// Validation rules
const registerValidation = [
  body('name').notEmpty().withMessage('Name is required').trim(),
  body('email').isEmail().withMessage('Must be a valid email address')
    .custom(value => {
      if (!value.endsWith('@gmail.com')) {
        throw new Error('Only @gmail.com addresses are allowed');
      }
      return true;
    }).normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('phone').matches(/^\d{10}$/).withMessage('Số điện thoại phải bao gồm đúng 10 chữ số')
];

const loginValidation = [
  body('email').isEmail().withMessage('Must be a valid email address').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required')
];

const passwordValidation = [
  body('current_password').notEmpty().withMessage('Current password is required'),
  body('new_password').isLength({ min: 6 }).withMessage('New password must be at least 6 characters long')
];

// Public routes
router.post('/register', registerValidation, authController.register);
router.post('/register-verify', authController.verifyRegister);
router.post('/login', loginValidation, authController.login);
router.post('/google', authController.googleLogin);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Protected routes
router.post('/change-password', verifyToken, passwordValidation, authController.changePassword);
router.post('/change-password-verify', verifyToken, authController.verifyChangePassword);
router.get('/profile', verifyToken, authController.getProfile);
router.put('/profile', verifyToken, authController.updateProfile);

module.exports = router;
