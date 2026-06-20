const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const emailService = require('../services/emailService');

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const generateToken = (user) => {
  return jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// POST /api/auth/register
exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: 'Validation error', data: errors.array() });
  }

  const { name, email, password, phone, address } = req.body;

  try {
    // Check if email already exists
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Email already exists', data: null });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Generate 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const code_hash = await bcrypt.hash(code, 10);

    const registration_token = jwt.sign(
      { name, email, password_hash, phone, address, code_hash },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    await emailService.sendRegistrationCode(email, code);

    res.status(200).json({
      success: true,
      message: 'Verification code sent to email',
      data: { registration_token }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};

// POST /api/auth/register-verify
exports.verifyRegister = async (req, res) => {
  const { registration_token, code } = req.body;
  
  if (!registration_token || !code) {
    return res.status(400).json({ success: false, message: 'Missing registration token or verification code' });
  }

  try {
    const decoded = jwt.verify(registration_token, JWT_SECRET);
    const isMatch = await bcrypt.compare(code.toString(), decoded.code_hash);
    
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid verification code' });
    }

    // Double check email existence just in case
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [decoded.email]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    const [result] = await db.query(
      'INSERT INTO users (name, email, password_hash, phone, address, role, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [decoded.name, decoded.email, decoded.password_hash, decoded.phone || null, decoded.address || null, 'customer', true]
    );

    const user = { id: result.insertId, name: decoded.name, email: decoded.email, role: 'customer' };
    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: { token, user }
    });

  } catch (error) {
    console.error(error);
    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({ success: false, message: 'Verification code expired. Please try registering again.' });
    }
    return res.status(400).json({ success: false, message: 'Invalid or expired token' });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: 'Validation error', data: errors.array() });
  }

  const { email, password } = req.body;

  try {
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials', data: null });
    }

    const user = users[0];

    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'Account is deactivated', data: null });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials', data: null });
    }

    const token = generateToken(user);
    res.json({
      success: true,
      message: 'Login successful',
      data: { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};

// POST /api/auth/change-password
exports.changePassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: 'Validation error', data: errors.array() });
  }

  const { current_password, new_password } = req.body;
  const user_id = req.user.id;

  try {
    const [users] = await db.query('SELECT password_hash, email FROM users WHERE id = ?', [user_id]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found', data: null });
    }

    const isMatch = await bcrypt.compare(current_password, users[0].password_hash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Incorrect current password', data: null });
    }

    const salt = await bcrypt.genSalt(10);
    const new_password_hash = await bcrypt.hash(new_password, salt);

    // Generate 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const code_hash = await bcrypt.hash(code, 10);

    const change_password_token = jwt.sign(
      { user_id, new_password_hash, code_hash },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    await emailService.sendPasswordChangeVerificationCode(users[0].email, code);

    res.json({
      success: true,
      message: 'Verification code sent to email',
      data: { change_password_token }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};

// POST /api/auth/change-password-verify
exports.verifyChangePassword = async (req, res) => {
  const { change_password_token, code } = req.body;
  const user_id = req.user.id;
  
  if (!change_password_token || !code) {
    return res.status(400).json({ success: false, message: 'Missing token or verification code' });
  }

  try {
    const decoded = jwt.verify(change_password_token, JWT_SECRET);
    
    if (decoded.user_id !== user_id) {
      return res.status(403).json({ success: false, message: 'Unauthorized action' });
    }

    const isMatch = await bcrypt.compare(code.toString(), decoded.code_hash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid verification code' });
    }

    await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [decoded.new_password_hash, user_id]);

    res.json({
      success: true,
      message: 'Password changed successfully',
      data: null
    });

  } catch (error) {
    console.error(error);
    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({ success: false, message: 'Verification code expired. Please try changing password again.' });
    }
    return res.status(400).json({ success: false, message: 'Invalid or expired token' });
  }
};

// GET /api/auth/profile
exports.getProfile = async (req, res) => {
  const user_id = req.user.id;
  try {
    const [users] = await db.query('SELECT id, name, email, phone, address, role, is_active, created_at FROM users WHERE id = ?', [user_id]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found', data: null });
    }

    res.json({
      success: true,
      message: 'Profile retrieved successfully',
      data: users[0]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};

// PUT /api/auth/profile
exports.updateProfile = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: 'Validation error', data: errors.array() });
  }

  const user_id = req.user.id;
  const { name, phone, address } = req.body;

  try {
    await db.query('UPDATE users SET name = ?, phone = ?, address = ? WHERE id = ?', [name, phone || null, address || null, user_id]);
    
    // Return updated profile
    const [users] = await db.query('SELECT id, name, email, phone, address, role, is_active, created_at FROM users WHERE id = ?', [user_id]);
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: users[0]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};

// POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

  try {
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 15 * 60000); // 15 mins

    await db.query('UPDATE users SET reset_code = ?, reset_code_expiry = ? WHERE id = ?', [resetCode, expiry, users[0].id]);
    await emailService.sendPasswordResetCode(email, resetCode);

    res.json({ success: true, message: 'Reset code sent to email' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/auth/reset-password
exports.resetPassword = async (req, res) => {
  const { email, code, new_password } = req.body;
  if (!email || !code || !new_password) return res.status(400).json({ success: false, message: 'Missing fields' });

  try {
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) return res.status(404).json({ success: false, message: 'User not found' });

    const user = users[0];
    if (!user.reset_code || user.reset_code !== code) {
      return res.status(400).json({ success: false, message: 'Invalid reset code' });
    }

    if (new Date(user.reset_code_expiry) < new Date()) {
      return res.status(400).json({ success: false, message: 'Reset code expired' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(new_password, salt);

    await db.query('UPDATE users SET password_hash = ?, reset_code = NULL, reset_code_expiry = NULL WHERE id = ?', [password_hash, user.id]);

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
