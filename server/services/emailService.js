const nodemailer = require('nodemailer');

// Singleton for the transporter
let transporter = null;

const getTransporter = async () => {
  if (transporter) return transporter;

  const isDummy = process.env.SMTP_HOST === 'smtp.ethereal.email' && process.env.SMTP_USER === 'dummy_user';
  
  if (isDummy) {
    console.log('Generating ethereal test account for emails...');
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log('Ethereal test account created:', testAccount.user);
  } else {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  return transporter;
};

const sendEmail = async (to, subject, html) => {
  try {
    const t = await getTransporter();
    const info = await t.sendMail({
      from: '"E-Commerce Admin" <no-reply@ecommerce.com>',
      to,
      subject,
      html,
    });
    console.log('Message sent: %s', info.messageId);
    if (info.messageId && process.env.SMTP_HOST === 'smtp.ethereal.email') {
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

const sendOrderConfirmation = async (email, orderId, items, total) => {
  const itemsHtml = items.map(item => `<li>${item.quantity}x (Product ID: ${item.product_id}) - $${parseFloat(item.price_at_purchase || 0).toFixed(2)}</li>`).join('');
  
  const estimatedDelivery = new Date();
  estimatedDelivery.setDate(estimatedDelivery.getDate() + 3);

  const html = `
    <h2>Thank you for your order!</h2>
    <p>Your order <strong>#${orderId}</strong> has been successfully placed.</p>
    <h3>Order Summary:</h3>
    <ul>${itemsHtml}</ul>
    <p><strong>Total:</strong> $${parseFloat(total).toFixed(2)}</p>
    <p>Estimated Delivery: ${estimatedDelivery.toDateString()}</p>
  `;

  return sendEmail(email, `Order Confirmation #${orderId}`, html);
};

const sendOrderStatusUpdate = async (email, orderId, status) => {
  const html = `
    <h2>Order Status Update</h2>
    <p>Your order <strong>#${orderId}</strong> status has been updated to: <strong>${status.toUpperCase()}</strong>.</p>
  `;
  return sendEmail(email, `Order Update #${orderId}`, html);
};

module.exports = {
  sendEmail,
  sendOrderConfirmation,
  sendOrderStatusUpdate
};
