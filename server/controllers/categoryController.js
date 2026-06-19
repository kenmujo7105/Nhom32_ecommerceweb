const db = require('../db');
const { validationResult } = require('express-validator');

// GET /api/categories
exports.getAllCategories = async (req, res) => {
  try {
    const { search, sort_by, sort_order, page, limit } = req.query;

    let query = `
      SELECT c.*, COALESCE(SUM(p.stock), 0) as total_stock 
      FROM categories c 
      LEFT JOIN products p ON c.id = p.category_id 
      WHERE 1=1
    `;
    let countQuery = 'SELECT COUNT(*) as total FROM categories c WHERE 1=1';
    const params = [];
    const countParams = [];
    
    if (search) {
      query += ' AND c.name LIKE ?';
      countQuery += ' AND c.name LIKE ?';
      params.push(`%${search}%`);
      countParams.push(`%${search}%`);
    }

    const validSortColumns = ['name', 'created_at', 'total_stock'];
    const validSortOrders = ['ASC', 'DESC'];
    
    const sortColumn = validSortColumns.includes(sort_by) ? (sort_by === 'total_stock' ? 'total_stock' : `c.${sort_by}`) : 'c.created_at';
    const sortDir = validSortOrders.includes(sort_order?.toUpperCase()) ? sort_order.toUpperCase() : 'DESC';

    query += ' GROUP BY c.id';
    query += ` ORDER BY ${sortColumn} ${sortDir}`;
    
    let paginationData = null;

    if (page) {
      const pageNum = parseInt(page) || 1;
      const limitNum = parseInt(limit) || 10;
      const offset = (pageNum - 1) * limitNum;
      
      query += ' LIMIT ? OFFSET ?';
      params.push(limitNum, offset);
      
      const [countResult] = await db.query(countQuery, countParams);
      paginationData = {
        page: pageNum,
        limit: limitNum,
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / limitNum)
      };
    }

    const [categories] = await db.query(query, params);

    res.json({
      success: true,
      data: categories,
      message: 'Categories retrieved successfully',
      pagination: paginationData
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};

// POST /api/admin/categories
exports.createCategory = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: 'Validation error', data: errors.array() });
  }

  const { name, slug } = req.body;
  try {
    const [result] = await db.query('INSERT INTO categories (name, slug) VALUES (?, ?)', [name, slug]);
    res.status(201).json({
      success: true,
      data: { id: result.insertId, name, slug },
      message: 'Category created successfully'
    });
  } catch (error) {
    console.error(error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'Category slug already exists', data: null });
    }
    res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};

// PUT /api/admin/categories/:id
exports.updateCategory = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: 'Validation error', data: errors.array() });
  }

  const { id } = req.params;
  const { name, slug } = req.body;

  try {
    const [result] = await db.query('UPDATE categories SET name = ?, slug = ? WHERE id = ?', [name, slug, id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Category not found', data: null });
    }
    res.json({
      success: true,
      data: { id, name, slug },
      message: 'Category updated successfully'
    });
  } catch (error) {
    console.error(error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'Category slug already exists', data: null });
    }
    res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};

// DELETE /api/admin/categories/:id
exports.deleteCategory = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM categories WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Category not found', data: null });
    }
    res.json({
      success: true,
      data: null,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error(error);
    // ER_ROW_IS_REFERENCED_2 means there are products linking to this category
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(400).json({ success: false, message: 'Cannot delete category with associated products', data: null });
    }
    res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};
