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

    // Add rating to products
    try {
      await connection.query("ALTER TABLE products ADD COLUMN rating DECIMAL(3, 2) DEFAULT 0;");
      console.log('Added rating to products');
    } catch (e) { console.log('rating likely exists', e.message); }

    // Add reviews_count to products
    try {
      await connection.query("ALTER TABLE products ADD COLUMN reviews_count INT DEFAULT 0;");
      console.log('Added reviews_count to products');
    } catch (e) { console.log('reviews_count likely exists', e.message); }

    // Create reviews table
    try {
      await connection.query(`
        CREATE TABLE IF NOT EXISTS reviews (
          id INT AUTO_INCREMENT PRIMARY KEY,
          product_id INT NOT NULL,
          user_id INT NOT NULL,
          rating INT NOT NULL CHECK(rating >= 1 AND rating <= 5),
          comment TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
      `);
      console.log('Created reviews table');
    } catch (e) { console.log('Error creating reviews table:', e.message); }

    console.log('Migration completed successfully.');
    connection.release();
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
