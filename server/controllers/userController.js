const db = require('../db');
const { validationResult } = require('express-validator');

// GET /api/admin/users
exports.getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    const { search, role } = req.query;

    let query = 'SELECT id, name, email, phone, address, role, is_active, created_at FROM users WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
    const params = [];
    const countParams = [];

    if (search) {
      query += ' AND (name LIKE ? OR email LIKE ?)';
      countQuery += ' AND (name LIKE ? OR email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
      countParams.push(`%${search}%`, `%${search}%`);
    }

    if (role) {
      query += ' AND role = ?';
      countQuery += ' AND role = ?';
      params.push(role);
      countParams.push(role);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [users] = await db.query(query, params);
    const [countResult] = await db.query(countQuery, countParams);
    const total = countResult[0].total;

    res.json({
      success: true,
      data: users,
      message: 'Users retrieved successfully',
      pagination: { page, limit, total }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};

// GET /api/admin/users/:id
exports.getUserById = async (req, res) => {
  const { id } = req.params;
  try {
    const [users] = await db.query('SELECT id, name, email, phone, address, role, is_active, created_at FROM users WHERE id = ?', [id]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found', data: null });
    }
    res.json({
      success: true,
      data: users[0],
      message: 'User retrieved successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};

// PATCH /api/admin/users/:id
exports.updateUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: 'Validation error', data: errors.array() });
  }

  const { id } = req.params;
  const { is_active, role } = req.body;

  try {
    // Only update provided fields
    const updates = [];
    const params = [];
    if (is_active !== undefined) {
      updates.push('is_active = ?');
      params.push(is_active);
    }
    if (role !== undefined) {
      updates.push('role = ?');
      params.push(role);
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields provided for update', data: null });
    }

    params.push(id);
    const [result] = await db.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'User not found', data: null });
    }
    
    res.json({
      success: true,
      message: 'User updated successfully',
      data: { id, is_active, role }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};

// DELETE /api/admin/users/:id
exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM users WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'User not found', data: null });
    }
    res.json({
      success: true,
      data: null,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error(error);
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(400).json({ success: false, message: 'Cannot delete user with existing orders', data: null });
    }
    res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};

exports.getRoles = (req, res) => {
  res.json({
    success: true,
    data: ['customer', 'admin'],
    message: 'Roles retrieved successfully'
  });
};
