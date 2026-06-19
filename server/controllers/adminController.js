const db = require('../db');

exports.getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];

    // 1. Revenue
    const [todayRevenueResult] = await db.query(
      "SELECT COALESCE(SUM(total_price), 0) as total FROM orders WHERE status NOT IN ('cancelled') AND DATE(created_at) = ?",
      [todayStr]
    );
    const [monthRevenueResult] = await db.query(
      "SELECT COALESCE(SUM(total_price), 0) as total FROM orders WHERE status NOT IN ('cancelled') AND DATE(created_at) >= ?",
      [firstDayOfMonth]
    );

    // 2. Orders by Status
    const [ordersStatusResult] = await db.query(
      "SELECT status, COUNT(*) as count FROM orders GROUP BY status"
    );
    const ordersByStatus = { pending: 0, processing: 0, completed: 0, cancelled: 0 };
    ordersStatusResult.forEach(row => {
      if (row.status === 'pending') ordersByStatus.pending += row.count;
      else if (['preparing', 'shipping'].includes(row.status)) ordersByStatus.processing += row.count;
      else if (['delivered', 'completed'].includes(row.status)) ordersByStatus.completed += row.count;
      else if (row.status === 'cancelled') ordersByStatus.cancelled += row.count;
    });

    // 3. Inventory
    const [totalProductsResult] = await db.query("SELECT COUNT(*) as total FROM products");
    const [lowStockResult] = await db.query("SELECT COUNT(*) as low FROM products WHERE stock < 10");

    // 4. Recent Orders
    const [recentOrdersResult] = await db.query(
      "SELECT id, customer_name as customer, total_price as total, status, created_at as date FROM orders ORDER BY created_at DESC LIMIT 5"
    );
    const recentOrders = recentOrdersResult.map(order => ({
      ...order,
      id: `#ORD-${String(order.id).padStart(3, '0')}`,
      date: new Date(order.date).toISOString().split('T')[0]
    }));

    // 5. Top Products
    const [topProductsResult] = await db.query(`
      SELECT 
        p.id, 
        p.name, 
        SUM(oi.quantity) as sales, 
        SUM(oi.quantity * oi.price_at_purchase) as revenue 
      FROM order_items oi 
      JOIN products p ON oi.product_id = p.id 
      JOIN orders o ON oi.order_id = o.id 
      WHERE o.status NOT IN ('cancelled') 
      GROUP BY p.id 
      ORDER BY sales DESC 
      LIMIT 5
    `);

    const topProducts = topProductsResult.map(product => ({
      id: `PRD-${String(product.id).padStart(3, '0')}`,
      name: product.name,
      sales: parseInt(product.sales),
      revenue: parseFloat(product.revenue)
    }));

    res.json({
      success: true,
      data: {
        revenue: {
          today: parseFloat(todayRevenueResult[0].total),
          month: parseFloat(monthRevenueResult[0].total)
        },
        ordersByStatus,
        inventory: {
          totalProducts: totalProductsResult[0].total,
          lowStock: lowStockResult[0].low
        },
        recentOrders,
        topProducts
      }
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ success: false, message: 'Server error', data: null });
  }
};
