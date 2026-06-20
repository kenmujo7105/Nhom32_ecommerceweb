const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { verifyToken } = require('../middleware/auth');

// Get all reviews for a product
router.get('/products/:productId/reviews', reviewController.getProductReviews);

// Add a review for a product (requires authentication)
router.post('/products/:productId/reviews', verifyToken, reviewController.addReview);

module.exports = router;
