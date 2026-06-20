const db = require('../db');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');

// GET /api/admin/users
exports.getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    const { search, role, is_active, sort_by, sort_order } = req.query;

    let query = 'SELECT id, name, email, phone, address, role, is_active, created_at FROM users WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
    const params = [];
    const countParams = [];

    if (search) {
      query += ' AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)';
      countQuery += ' AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (role) {
      if (role === 'admin') {
        query += " AND role IN ('admin', 'superadmin')";
        countQuery += " AND role IN ('admin', 'superadmin')";
      } else {
        query += ' AND role = ?';
        countQuery += ' AND role = ?';
        params.push(role);
        countParams.push(role);
      }
    }

    if (is_active !== undefined && is_active !== '') {
      query += ' AND is_active = ?';
      countQuery += ' AND is_active = ?';
      const activeValue = is_active === 'true' || is_active === '1' ? 1 : 0;
      params.push(activeValue);
      countParams.push(activeValue);
    }

    const validSortColumns = ['name', 'created_at'];
    const validSortOrders = ['ASC', 'DESC'];
    
    const sortColumn = validSortColumns.includes(sort_by) ? sort_by : 'created_at';
    const sortDir = validSortOrders.includes(sort_order?.toUpperCase()) ? sort_order.toUpperCase() : 'DESC';

    query += ` ORDER BY ${sortColumn} ${sortDir} LIMIT ? OFFSET ?`;
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
    const [userToDelete] = await db.query('SELECT role FROM users WHERE id = ?', [id]);
    if (userToDelete.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found', data: null });
    }
    
    const targetRole = userToDelete[0].role;
    const currentRole = req.user.role;

    // A user cannot delete themselves (including superadmin deleting themselves)
    if (parseInt(id) === req.user.id) {
      return res.status(403).json({ success: false, message: 'Cannot delete your own account', data: null });
    }

    // Only superadmin can delete an admin
    if (targetRole === 'admin' && currentRole !== 'superadmin') {
      return res.status(403).json({ success: false, message: 'Only Super Admin can delete admin accounts', data: null });
    }

    // No one can delete a superadmin
    if (targetRole === 'superadmin') {
      return res.status(403).json({ success: false, message: 'Super Admin account cannot be deleted', data: null });
    }

    const [result] = await db.query('DELETE FROM users WHERE id = ?', [id]);
    
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
    data: ['customer', 'admin', 'superadmin'],
    message: 'Roles retrieved successfully'
  });
};

// POST /api/admin/admins
exports.createAdmin = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: 'Validation error', data: errors.array() });
  }

  const { name, email, password, is_active } = req.body;

  try {
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    const active = is_active !== undefined ? is_active : 1;

    const [result] = await db.query(
      'INSERT INTO users (name, email, password_hash, role, is_active) VALUES (?, ?, ?, ?, ?)',
      [name, email, password_hash, 'admin', active]
    );

    res.status(201).json({
      success: true,
      message: 'Admin created successfully',
      data: { id: result.insertId, name, email, role: 'admin', is_active: active }
    });
  } catch (error) {
    console.error(error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'Email already exists', data: null });
    }
    res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};

// PUT /api/admin/admins/:id
exports.updateAdmin = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: 'Validation error', data: errors.array() });
  }

  const { id } = req.params;
  const { name, email, password, is_active } = req.body;

  try {
    const updates = [];
    const params = [];

    if (name) { updates.push('name = ?'); params.push(name); }
    if (email) { updates.push('email = ?'); params.push(email); }
    if (is_active !== undefined) { updates.push('is_active = ?'); params.push(is_active); }
    if (password) {
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(password, salt);
      updates.push('password_hash = ?');
      params.push(password_hash);
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields to update', data: null });
    }

    // Prevent updating a superadmin, or changing an admin if not superadmin
    const [targetAdmin] = await db.query('SELECT role FROM users WHERE id = ?', [id]);
    if (targetAdmin.length > 0) {
      if (targetAdmin[0].role === 'superadmin' && req.user.id !== parseInt(id)) {
        return res.status(403).json({ success: false, message: 'Cannot modify another Super Admin', data: null });
      }
      if (targetAdmin[0].role === 'admin' && req.user.role !== 'superadmin' && req.user.id !== parseInt(id)) {
        return res.status(403).json({ success: false, message: 'Only Super Admin can modify other admins', data: null });
      }
    }

    params.push(id);
    const [result] = await db.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ? AND role IN ('admin', 'superadmin')`, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Admin not found', data: null });
    }

    res.json({
      success: true,
      message: 'Admin updated successfully',
      data: { id, name, email, is_active }
    });
  } catch (error) {
    console.error(error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'Email already exists', data: null });
    }
    res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};

// GET /api/admin/users/:id/products
exports.getUserPurchasedProducts = async (req, res) => {
  const { id } = req.params;
  try {
    const query = `
      SELECT 
        p.id, 
        p.name, 
        p.image, 
        oi.price_at_purchase as price, 
        SUM(oi.quantity) as total_quantity, 
        MAX(o.created_at) as last_purchased
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN products p ON oi.product_id = p.id
      WHERE o.user_id = ? AND o.status NOT IN ('cancelled')
      GROUP BY p.id, p.name, p.image, oi.price_at_purchase
      ORDER BY last_purchased DESC
    `;
    const [products] = await db.query(query, [id]);
    res.json({
      success: true,
      data: products,
      message: 'Purchased products retrieved successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};
