const db = require('../db');
const { validationResult } = require('express-validator');
const emailService = require('../services/emailService');

// POST /api/orders
exports.createOrder = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: 'Validation error', data: errors.array() });
  }

  const { customer_name, customer_email, customer_phone, customer_address, items, payment_method } = req.body;
  const user_id = req.user ? req.user.id : null;

  if (!items || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Order must contain at least one item', data: null });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    let total_price = 0;
    const orderItemsData = [];

    // Verify stock and calculate total price
    for (const item of items) {
      const { product_id, quantity } = item;
      
      const [products] = await connection.query('SELECT * FROM products WHERE id = ? FOR UPDATE', [product_id]);
      if (products.length === 0) {
        throw new Error(`Product with ID ${product_id} not found`);
      }
      
      const product = products[0];
      if (product.stock < quantity) {
        throw new Error(`Insufficient stock for product: ${product.name}`);
      }

      // Decrement stock ONLY if not VNPAY
      if (payment_method !== 'vnpay') {
        await connection.query('UPDATE products SET stock = stock - ? WHERE id = ?', [quantity, product_id]);
      }

      // Use sale_price if available, otherwise price
      const priceAtPurchase = product.sale_price ? parseFloat(product.sale_price) : parseFloat(product.price);
      total_price += priceAtPurchase * quantity;

      orderItemsData.push([product_id, quantity, priceAtPurchase]);
    }

    // Create the order
    const [orderResult] = await connection.query(
      'INSERT INTO orders (user_id, customer_name, customer_email, customer_phone, customer_address, total_price, status, payment_method) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [user_id, customer_name, customer_email, customer_phone, customer_address, total_price, 'pending', payment_method || 'cod']
    );
    const order_id = orderResult.insertId;

    // Insert order items
    const orderItemsValues = orderItemsData.map(data => [order_id, ...data]);
    await connection.query(
      'INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) VALUES ?',
      [orderItemsValues]
    );

    await connection.commit();

    // Send confirmation email asynchronously (don't block response)
    if (customer_email) {
      emailService.sendOrderConfirmation(customer_email, order_id, orderItemsData.map(item => ({ product_id: item[0], quantity: item[1], price_at_purchase: item[2] })), total_price)
        .catch(err => console.error("Failed to send confirmation email", err));
    }

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: { order_id, total_price, status: 'pending' }
    });

  } catch (error) {
    await connection.rollback();
    console.error('Order creation failed:', error);
    res.status(400).json({ success: false, message: error.message || 'Order creation failed', data: null });
  } finally {
    connection.release();
  }
};

// GET /api/admin/orders
exports.getAdminOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    const { search, status, sort_by, sort_order } = req.query;

    let query = 'SELECT * FROM orders WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) as total FROM orders WHERE 1=1';
    const params = [];
    const countParams = [];

    if (search) {
      query += ' AND (customer_name LIKE ? OR customer_phone LIKE ?)';
      countQuery += ' AND (customer_name LIKE ? OR customer_phone LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
      countParams.push(`%${search}%`, `%${search}%`);
    }

    if (status) {
      query += ' AND status = ?';
      countQuery += ' AND status = ?';
      params.push(status);
      countParams.push(status);
    }

    // Sorting
    const validSortColumns = ['total_price', 'status', 'created_at'];
    const validSortOrders = ['ASC', 'DESC'];
    
    const sortColumn = validSortColumns.includes(sort_by) ? sort_by : 'created_at';
    const sortDir = validSortOrders.includes(sort_order?.toUpperCase()) ? sort_order.toUpperCase() : 'DESC';
    
    query += ` ORDER BY ${sortColumn} ${sortDir} LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const [orders] = await db.query(query, params);
    const [countResult] = await db.query(countQuery, countParams);
    const total = countResult[0].total;

    res.json({
      success: true,
      data: orders,
      message: 'Orders retrieved successfully',
      pagination: { page, limit, total }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};

// GET /api/admin/orders/:id
exports.getAdminOrderById = async (req, res) => {
  const { id } = req.params;
  try {
    const [orders] = await db.query('SELECT * FROM orders WHERE id = ?', [id]);
    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found', data: null });
    }
    
    const order = orders[0];
    const [items] = await db.query(`
      SELECT oi.*, p.name as product_name 
      FROM order_items oi 
      JOIN products p ON oi.product_id = p.id 
      WHERE oi.order_id = ?
    `, [id]);

    order.items = items;

    res.json({
      success: true,
      data: order,
      message: 'Order retrieved successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};

// PATCH /api/admin/orders/:id/status
exports.updateOrderStatus = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: 'Validation error', data: errors.array() });
  }

  const { id } = req.params;
  const { status } = req.body;

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [currentOrder] = await connection.query('SELECT status, customer_email FROM orders WHERE id = ? FOR UPDATE', [id]);
    if (currentOrder.length === 0) {
      throw new Error('Order not found');
    }

    const oldStatus = currentOrder[0].status;

    // Restore stock if changing to cancelled
    if (oldStatus !== 'cancelled' && status === 'cancelled') {
      const [items] = await connection.query('SELECT product_id, quantity FROM order_items WHERE order_id = ?', [id]);
      for (const item of items) {
        await connection.query('UPDATE products SET stock = stock + ? WHERE id = ?', [item.quantity, item.product_id]);
      }
    } 
    // Deduct stock if un-cancelling
    else if (oldStatus === 'cancelled' && status !== 'cancelled') {
      const [items] = await connection.query('SELECT product_id, quantity FROM order_items WHERE order_id = ?', [id]);
      for (const item of items) {
        await connection.query('UPDATE products SET stock = stock - ? WHERE id = ?', [item.quantity, item.product_id]);
      }
    }

    await connection.query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);

    await connection.commit();

    // If status is shipping, delivered or cancelled, send email
    if (['shipping', 'delivered', 'cancelled'].includes(status) && currentOrder[0].customer_email) {
      emailService.sendOrderStatusUpdate(currentOrder[0].customer_email, id, status)
        .catch(err => console.error("Failed to send status update email", err));
    }

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: { id, status }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Update order status failed:', error);
    const statusCode = error.message === 'Order not found' ? 404 : 500;
    res.status(statusCode).json({ success: false, message: error.message || 'Server error', data: null });
  } finally {
    connection.release();
  }
};

// GET /api/orders/my
exports.getMyOrders = async (req, res) => {
  const user_id = req.user.id;
  try {
    const [orders] = await db.query('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC', [user_id]);
    
    if (orders.length > 0) {
      const orderIds = orders.map(o => o.id);
      const [items] = await db.query(`
        SELECT oi.*, p.name as product_name, p.image_url 
        FROM order_items oi 
        JOIN products p ON oi.product_id = p.id 
        WHERE oi.order_id IN (?)
      `, [orderIds]);

      orders.forEach(order => {
        order.items = items.filter(item => item.order_id === order.id);
      });
    }

    res.json({
      success: true,
      data: orders,
      message: 'User orders retrieved successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};

// PATCH /api/orders/:id/cancel
exports.cancelMyOrder = async (req, res) => {
  const { id } = req.params;
  const user_id = req.user.id;

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [orders] = await connection.query('SELECT status, customer_email FROM orders WHERE id = ? AND user_id = ?', [id, user_id]);
    if (orders.length === 0) {
      throw new Error('Order not found or unauthorized');
    }

    if (orders[0].status !== 'pending' && orders[0].status !== 'preparing') {
      throw new Error('Only pending or preparing orders can be cancelled');
    }

    // Restore stock
    const [items] = await connection.query('SELECT product_id, quantity FROM order_items WHERE order_id = ?', [id]);
    for (const item of items) {
      await connection.query('UPDATE products SET stock = stock + ? WHERE id = ?', [item.quantity, item.product_id]);
    }

    // Update status to cancelled
    await connection.query('UPDATE orders SET status = ? WHERE id = ?', ['cancelled', id]);

    await connection.commit();

    // Send cancellation email
    if (orders[0].customer_email) {
      emailService.sendOrderStatusUpdate(orders[0].customer_email, id, 'cancelled')
        .catch(err => console.error("Failed to send cancellation email", err));
    }

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      data: { id, status: 'cancelled' }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Order cancellation failed:', error);
    const status = error.message.includes('not found') ? 404 : 400;
    res.status(status).json({ success: false, message: error.message || 'Server error', data: null });
  } finally {
    connection.release();
  }
};
