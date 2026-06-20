const db = require('../db');

// POST /api/products/:productId/reviews
exports.addReview = async (req, res) => {
  const { productId } = req.params;
  const { rating, comment } = req.body;
  const userId = req.user.id;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
  }

  try {
    // 1. Check if user has purchased the product and order is completed/delivered
    const checkPurchaseQuery = `
      SELECT 1 FROM orders o 
      JOIN order_items oi ON o.id = oi.order_id 
      WHERE o.user_id = ? AND oi.product_id = ? AND o.status IN ('delivered', 'completed') 
      LIMIT 1
    `;
    const [purchaseResult] = await db.query(checkPurchaseQuery, [userId, productId]);

    if (purchaseResult.length === 0) {
      return res.status(403).json({ success: false, message: 'You can only review products you have purchased and received.' });
    }

    // 2. Check if user already reviewed this product
    const checkReviewQuery = 'SELECT 1 FROM reviews WHERE user_id = ? AND product_id = ? LIMIT 1';
    const [existingReview] = await db.query(checkReviewQuery, [userId, productId]);

    if (existingReview.length > 0) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this product.' });
    }

    // 3. Insert review
    await db.query(
      'INSERT INTO reviews (product_id, user_id, rating, comment) VALUES (?, ?, ?, ?)',
      [productId, userId, rating, comment]
    );

    // 4. Update product rating and reviews_count
    const [stats] = await db.query('SELECT AVG(rating) as avg_rating, COUNT(id) as count FROM reviews WHERE product_id = ?', [productId]);
    const avgRating = stats[0].avg_rating || 0;
    const reviewCount = stats[0].count || 0;

    await db.query('UPDATE products SET rating = ?, reviews_count = ? WHERE id = ?', [avgRating, reviewCount, productId]);

    res.status(201).json({
      success: true,
      message: 'Review added successfully'
    });
  } catch (error) {
    console.error('Error adding review:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/products/:productId/reviews
exports.getProductReviews = async (req, res) => {
  const { productId } = req.params;

  try {
    const query = `
      SELECT r.*, u.name as user_name 
      FROM reviews r 
      JOIN users u ON r.user_id = u.id 
      WHERE r.product_id = ? 
      ORDER BY r.created_at DESC
    `;
    const [reviews] = await db.query(query, [productId]);

    res.json({
      success: true,
      data: reviews,
      message: 'Reviews retrieved successfully'
    });
  } catch (error) {
    console.error('Error retrieving reviews:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
