const crypto = require('crypto');
const db = require('../db');

function sortObject(obj) {
  let sorted = {};
  let str = [];
  let key;
  for (key in obj) {
    if (obj.hasOwnProperty(key)) {
      str.push(encodeURIComponent(key));
    }
  }
  str.sort();
  for (key = 0; key < str.length; key++) {
    sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
  }
  return sorted;
}

function formatVNPayDate(date) {
  const yyyy = date.getFullYear().toString();
  const MM = (date.getMonth() + 1).toString().padStart(2, '0');
  const dd = date.getDate().toString().padStart(2, '0');
  const HH = date.getHours().toString().padStart(2, '0');
  const mm = date.getMinutes().toString().padStart(2, '0');
  const ss = date.getSeconds().toString().padStart(2, '0');
  return yyyy + MM + dd + HH + mm + ss;
}

exports.createVNPayUrl = async (req, res) => {
  try {
    const { order_id } = req.body;
    
    // Fetch order
    const [orders] = await db.query('SELECT * FROM orders WHERE id = ?', [order_id]);
    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    const order = orders[0];

    let ipAddr = req.headers['x-forwarded-for'] ||
        req.connection?.remoteAddress ||
        req.socket?.remoteAddress || '127.0.0.1';

    let tmnCode = process.env.VNP_TMNCODE;
    let secretKey = process.env.VNP_HASHSECRET;
    let vnpUrl = process.env.VNP_URL;
    let returnUrl = process.env.VNP_RETURNURL.replace('{orderId}', order_id);

    let amount = Math.round(parseFloat(order.total_price)) * 100;
    
    let createDate = formatVNPayDate(new Date());
    let expireDate = formatVNPayDate(new Date(Date.now() + 15 * 60 * 1000));

    let vnp_Params = {};
    vnp_Params['vnp_Version'] = '2.1.0';
    vnp_Params['vnp_Command'] = 'pay';
    vnp_Params['vnp_TmnCode'] = tmnCode;
    vnp_Params['vnp_Locale'] = 'vn';
    vnp_Params['vnp_CurrCode'] = 'VND';
    vnp_Params['vnp_TxnRef'] = order_id + '_' + createDate;
    vnp_Params['vnp_OrderInfo'] = 'Thanh toan don hang ' + order_id;
    vnp_Params['vnp_OrderType'] = 'other';
    vnp_Params['vnp_Amount'] = amount;
    vnp_Params['vnp_ReturnUrl'] = returnUrl;
    vnp_Params['vnp_IpAddr'] = ipAddr;
    vnp_Params['vnp_CreateDate'] = createDate;
    vnp_Params['vnp_ExpireDate'] = expireDate;

    vnp_Params = sortObject(vnp_Params);

    let signData = Object.keys(vnp_Params).map(key => `${key}=${vnp_Params[key]}`).join('&');
    let hmac = crypto.createHmac("sha512", secretKey);
    let signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex"); 
    vnp_Params['vnp_SecureHash'] = signed;
    vnpUrl += '?' + Object.keys(vnp_Params).map(key => `${key}=${vnp_Params[key]}`).join('&');

    // We can save the txnRef if we want, reusing stripe_session_id for simplicity as it's a varchar
    await db.query("UPDATE orders SET stripe_session_id = ? WHERE id = ?", [vnp_Params['vnp_TxnRef'], order_id]);

    res.json({ success: true, url: vnpUrl });
  } catch (error) {
    console.error('VNPay create error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.vnpayReturn = async (req, res) => {
  try {
    let vnp_Params = req.body;
    let secureHash = vnp_Params['vnp_SecureHash'];

    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    vnp_Params = sortObject(vnp_Params);

    let secretKey = process.env.VNP_HASHSECRET;
    let signData = Object.keys(vnp_Params).map(key => `${key}=${vnp_Params[key]}`).join('&');
    let hmac = crypto.createHmac("sha512", secretKey);
    let signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");     

    if(secureHash === signed){
      if (vnp_Params['vnp_ResponseCode'] === '00') {
         // Payment successful
         const order_id = vnp_Params['vnp_TxnRef'].split('_')[0];
         
         // Check if already paid to prevent double deduction
         const [orderCheck] = await db.query("SELECT payment_status FROM orders WHERE id = ?", [order_id]);
         if (orderCheck.length > 0 && orderCheck[0].payment_status !== 'paid') {
           // Deduct stock here since we didn't do it at order creation
           const [items] = await db.query('SELECT product_id, quantity FROM order_items WHERE order_id = ?', [order_id]);
           for (const item of items) {
             await db.query('UPDATE products SET stock = stock - ? WHERE id = ?', [item.quantity, item.product_id]);
           }
           await db.query("UPDATE orders SET payment_status = 'paid' WHERE id = ?", [order_id]);
         }
         
         res.json({success: true, message: 'Payment verified successfully'});
      } else {
         res.status(400).json({success: false, message: 'Payment failed at gateway', code: vnp_Params['vnp_ResponseCode']});
      }
    } else {
      res.status(400).json({success: false, message: 'Checksum failed'});
    }
  } catch (error) {
    console.error('VNPay return error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
