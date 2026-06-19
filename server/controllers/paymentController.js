const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const db = require('../db');

exports.createCheckoutSession = async (req, res) => {
  try {
    const { order_id } = req.body;
    
    // Fetch order
    const [orders] = await db.query('SELECT * FROM orders WHERE id = ?', [order_id]);
    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    const order = orders[0];

    // Fetch order items
    const [items] = await db.query(`
      SELECT oi.*, p.name as product_name 
      FROM order_items oi 
      JOIN products p ON oi.product_id = p.id 
      WHERE oi.order_id = ?
    `, [order_id]);

    const line_items = items.map(item => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.product_name,
        },
        unit_amount: Math.round(item.price_at_purchase * 100), // Stripe uses cents
      },
      quantity: item.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/order-success/${order_id}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/checkout`,
      client_reference_id: String(order_id),
      customer_email: order.customer_email || undefined,
    });

    // Save session id to order
    await db.query('UPDATE orders SET stripe_session_id = ? WHERE id = ?', [session.id, order_id]);

    res.json({ success: true, url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { session_id } = req.body;
    
    // Validate session with Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id);
    
    if (session.payment_status === 'paid') {
      const order_id = session.client_reference_id;
      // Mark order as paid
      await db.query("UPDATE orders SET payment_status = 'paid' WHERE id = ? AND stripe_session_id = ?", [order_id, session_id]);
      
      return res.json({ success: true, message: 'Payment verified successfully' });
    }
    
    res.status(400).json({ success: false, message: 'Payment not successful' });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
