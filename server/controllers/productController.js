const db = require('../db');
const { validationResult } = require('express-validator');

// GET /api/products
exports.getAllProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    const { search, category_id, min_price, max_price, sort_by, sort_order } = req.query;

    let query = 'SELECT * FROM products WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) as total FROM products WHERE 1=1';
    const params = [];
    const countParams = [];

    if (search) {
      query += ' AND name LIKE ?';
      countQuery += ' AND name LIKE ?';
      params.push(`%${search}%`);
      countParams.push(`%${search}%`);
    }

    if (category_id) {
      query += ' AND category_id = ?';
      countQuery += ' AND category_id = ?';
      params.push(category_id);
      countParams.push(category_id);
    }

    if (min_price) {
      query += ' AND price >= ?';
      countQuery += ' AND price >= ?';
      params.push(min_price);
      countParams.push(min_price);
    }

    if (max_price) {
      query += ' AND price <= ?';
      countQuery += ' AND price <= ?';
      params.push(max_price);
      countParams.push(max_price);
    }

    // Sorting
    const validSortColumns = ['price', 'name', 'created_at'];
    const validSortOrders = ['ASC', 'DESC'];
    
    const sortColumn = validSortColumns.includes(sort_by) ? sort_by : 'created_at';
    const sortDir = validSortOrders.includes(sort_order?.toUpperCase()) ? sort_order.toUpperCase() : 'DESC';
    
    query += ` ORDER BY ${sortColumn} ${sortDir}`;
    
    // Pagination
    query += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [products] = await db.query(query, params);
    const [countResult] = await db.query(countQuery, countParams);
    const total = countResult[0].total;

    res.json({
      success: true,
      data: products,
      message: 'Products retrieved successfully',
      pagination: {
        page,
        limit,
        total
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};

// GET /api/products/:id
exports.getProductById = async (req, res) => {
  const { id } = req.params;
  try {
    const [products] = await db.query('SELECT * FROM products WHERE id = ?', [id]);
    if (products.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found', data: null });
    }
    res.json({
      success: true,
      data: products[0],
      message: 'Product retrieved successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};

// POST /api/admin/products
exports.createProduct = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: 'Validation error', data: errors.array() });
  }

  const { category_id, name, slug, description, price, sale_price, image_url, stock } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO products (category_id, name, slug, description, price, sale_price, image_url, stock) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [category_id, name, slug, description, price, sale_price || null, image_url || null, stock || 0]
    );
    res.status(201).json({
      success: true,
      data: { id: result.insertId, ...req.body },
      message: 'Product created successfully'
    });
  } catch (error) {
    console.error(error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'Product slug already exists', data: null });
    }
    res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};

// PUT /api/admin/products/:id
exports.updateProduct = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: 'Validation error', data: errors.array() });
  }

  const { id } = req.params;
  const { category_id, name, slug, description, price, sale_price, image_url, stock } = req.body;

  try {
    const [result] = await db.query(
      'UPDATE products SET category_id = ?, name = ?, slug = ?, description = ?, price = ?, sale_price = ?, image_url = ?, stock = ? WHERE id = ?',
      [category_id, name, slug, description, price, sale_price || null, image_url || null, stock || 0, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Product not found', data: null });
    }
    
    res.json({
      success: true,
      data: { id, ...req.body },
      message: 'Product updated successfully'
    });
  } catch (error) {
    console.error(error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'Product slug already exists', data: null });
    }
    res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};

// DELETE /api/admin/products/:id
exports.deleteProduct = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM products WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Product not found', data: null });
    }
    res.json({
      success: true,
      data: null,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error(error);
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(400).json({ success: false, message: 'Cannot delete product currently in orders', data: null });
    }
    res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};
