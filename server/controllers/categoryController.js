const db = require('../db');
const { validationResult } = require('express-validator');

// GET /api/categories
exports.getAllCategories = async (req, res) => {
  try {
    const [categories] = await db.query('SELECT * FROM categories ORDER BY created_at DESC');
    res.json({
      success: true,
      data: categories,
      message: 'Categories retrieved successfully'
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
