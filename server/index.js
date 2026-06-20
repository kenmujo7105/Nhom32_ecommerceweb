const express = require('express');
const cors = require('cors');
require('dotenv').config();

const db = require('./db');
const categoryRoutes = require('./routes/categoryRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const chatRoutes = require('./routes/chatRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', categoryRoutes);
app.use('/api', productRoutes);
app.use('/api', orderRoutes);
app.use('/api/auth', authRoutes);
app.use('/api', userRoutes);
app.use('/api', paymentRoutes);
app.use('/api', adminRoutes);
app.use('/api', chatRoutes);

// Basic Route
app.get('/', (req, res) => {
  res.send('E-commerce API is running!');
});

// Example DB check route
app.get('/api/health', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT 1');
    res.json({ status: 'ok', message: 'Database connected successfully' });
  } catch (error) {
    console.error('Database connection failed:', error);
    res.status(500).json({ status: 'error', message: 'Database connection failed' });
  }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
