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

const sendPasswordResetCode = async (email, code) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
      <h2 style="color: #4f46e5; text-align: center;">Reset Your Password</h2>
      <p>You recently requested to reset your password for your E-Commerce Admin account. Use the code below to reset it. <strong>This password reset code is only valid for the next 15 minutes.</strong></p>
      <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1e293b;">${code}</span>
      </div>
      <p>If you did not request a password reset, please ignore this email or contact support if you have questions.</p>
      <p style="margin-top: 30px; font-size: 12px; color: #64748b; text-align: center;">
        &copy; ${new Date().getFullYear()} E-Commerce Admin. All rights reserved.
      </p>
    </div>
  `;
  return sendEmail(email, 'Password Reset Code', html);
};

const sendRegistrationCode = async (email, code) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
      <h2 style="color: #4f46e5; text-align: center;">Verify Your Email Address</h2>
      <p>Thank you for registering! Use the code below to verify your email address and complete your registration. <strong>This code is only valid for the next 15 minutes.</strong></p>
      <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1e293b;">${code}</span>
      </div>
      <p>If you did not register for an account, please ignore this email.</p>
      <p style="margin-top: 30px; font-size: 12px; color: #64748b; text-align: center;">
        &copy; ${new Date().getFullYear()} E-Commerce. All rights reserved.
      </p>
    </div>
  `;
  return sendEmail(email, 'Email Verification Code', html);
};

const sendPasswordChangeVerificationCode = async (email, code) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
      <h2 style="color: #4f46e5; text-align: center;">Verify Password Change</h2>
      <p>We received a request to change the password for your account. Use the code below to verify this action. <strong>This code is only valid for the next 15 minutes.</strong></p>
      <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1e293b;">${code}</span>
      </div>
      <p>If you did not request this change, please ignore this email and your password will remain unchanged.</p>
      <p style="margin-top: 30px; font-size: 12px; color: #64748b; text-align: center;">
        &copy; ${new Date().getFullYear()} E-Commerce. All rights reserved.
      </p>
    </div>
  `;
  return sendEmail(email, 'Verify Password Change', html);
};

module.exports = {
  sendEmail,
  sendOrderConfirmation,
  sendOrderStatusUpdate,
  sendPasswordResetCode,
  sendRegistrationCode,
  sendPasswordChangeVerificationCode
};
