const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key';

exports.verifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1]; // Format: Bearer <token>
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access Denied. No token provided.',
      data: null
    });
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified; // { id, role, ... }
    next();
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Invalid token.',
      data: null
    });
  }
};

exports.optionalAuth = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  
  if (!token) {
    return next(); // Proceed without req.user
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (error) {
    // If token is present but invalid, we still proceed, or we can reject.
    // Usually, an invalid token should be rejected even for optional routes.
    res.status(400).json({
      success: false,
      message: 'Invalid token provided for optional auth.',
      data: null
    });
  }
};

exports.isAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'superadmin')) {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Access Denied. Admin privileges required.',
      data: null
    });
  }
};
