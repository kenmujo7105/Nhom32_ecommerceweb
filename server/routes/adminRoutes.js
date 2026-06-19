const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, isAdmin } = require('../middleware/auth');

// Protected admin routes
router.get('/admin/stats', verifyToken, isAdmin, adminController.getDashboardStats);

module.exports = router;
