const db = require('../db');

exports.getDashboardStats = async (req, res) => {
  try {
    const targetMonth = req.query.month || new Date().toISOString().slice(0, 7);
    const [year, month] = targetMonth.split('-');
    
    const startDate = `${year}-${month}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${month}-${lastDay}`;

    // 1. Revenue (Selected Month)
    const [monthRevenueResult] = await db.query(
      "SELECT COALESCE(SUM(total_price), 0) as total FROM orders WHERE status NOT IN ('cancelled') AND DATE(created_at) >= ? AND DATE(created_at) <= ?",
      [startDate, endDate]
    );

    // Daily Revenue Breakdown
    const [dailyRevenueResult] = await db.query(
      "SELECT DATE(created_at) as date, COALESCE(SUM(total_price), 0) as total FROM orders WHERE status NOT IN ('cancelled') AND DATE(created_at) >= ? AND DATE(created_at) <= ? GROUP BY DATE(created_at) ORDER BY date ASC",
      [startDate, endDate]
    );

    const dailyRevenues = dailyRevenueResult.map(r => {
      // Handle timezone offset if needed, simple slice of local ISO string
      const d = new Date(r.date);
      const tzOffset = d.getTimezoneOffset() * 60000; // offset in milliseconds
      const localISOTime = (new Date(d - tzOffset)).toISOString().slice(0, -1);
      return {
        date: localISOTime.split('T')[0],
        total: parseFloat(r.total)
      };
    });

    // Weekly Revenue Logic (grouping daily by 7-day chunks)
    const weeklyRevenues = [
      { week: 'Week 1 (1-7)', total: 0 },
      { week: 'Week 2 (8-14)', total: 0 },
      { week: 'Week 3 (15-21)', total: 0 },
      { week: 'Week 4 (22-28)', total: 0 },
      { week: `Week 5 (29-${lastDay})`, total: 0 }
    ];

    dailyRevenues.forEach(r => {
       const dayNum = parseInt(r.date.split('-')[2], 10);
       let weekIndex = Math.floor((dayNum - 1) / 7);
       if (weekIndex > 4) weekIndex = 4;
       weeklyRevenues[weekIndex].total += r.total;
    });

    const validWeeklyRevenues = weeklyRevenues.filter((w, i) => i < 4 || lastDay > 28);
    const totalMonthRevenue = parseFloat(monthRevenueResult[0].total);
    const averageDaily = dailyRevenues.length > 0 ? (totalMonthRevenue / dailyRevenues.length) : 0;

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
          month: totalMonthRevenue,
          averageDaily: averageDaily,
          dailyRevenues: dailyRevenues,
          weeklyRevenues: validWeeklyRevenues,
          targetMonth: targetMonth
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
