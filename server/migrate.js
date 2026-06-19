const db = require('./db');

async function runMigration() {
  try {
    const connection = await db.getConnection();
    
    console.log('Running migration: Adding fields to tables...');
    
    // Add gallery_images to products
    try {
      await connection.query("ALTER TABLE products ADD COLUMN gallery_images JSON DEFAULT NULL;");
      console.log('Added gallery_images to products');
    } catch (e) { console.log('gallery_images likely exists', e.message); }
    
    // Add reset_code to users
    try {
      await connection.query("ALTER TABLE users ADD COLUMN reset_code VARCHAR(10) NULL;");
      console.log('Added reset_code');
    } catch (e) { console.log('reset_code likely exists', e.message); }

    // Add reset_code_expiry to users
    try {
      await connection.query("ALTER TABLE users ADD COLUMN reset_code_expiry DATETIME NULL;");
      console.log('Added reset_code_expiry');
    } catch (e) { console.log('reset_code_expiry likely exists', e.message); }
    
    // Add customer_email
    try {
      await connection.query("ALTER TABLE orders ADD COLUMN customer_email VARCHAR(255) NOT NULL DEFAULT 'test@example.com';");
      console.log('Added customer_email');
    } catch (e) { console.log('customer_email likely exists', e.message); }
    
    // Add payment_method
    try {
      await connection.query("ALTER TABLE orders ADD COLUMN payment_method VARCHAR(50) DEFAULT 'cod';");
      console.log('Added payment_method');
    } catch (e) { console.log('payment_method likely exists', e.message); }

    // Add payment_status
    try {
      await connection.query("ALTER TABLE orders ADD COLUMN payment_status ENUM('pending', 'paid', 'failed') DEFAULT 'pending';");
      console.log('Added payment_status');
    } catch (e) { console.log('payment_status likely exists', e.message); }

    // Add stripe_session_id
    try {
      await connection.query("ALTER TABLE orders ADD COLUMN stripe_session_id VARCHAR(255) NULL;");
      console.log('Added stripe_session_id');
    } catch (e) { console.log('stripe_session_id likely exists', e.message); }

    console.log('Migration completed successfully.');
    connection.release();
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
