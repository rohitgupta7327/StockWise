const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const mongoSanitize = require('./middleware/mongoSanitize');
const { apiLimiter } = require('./middleware/rateLimiter');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// 1. Security Headers with Helmet
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// 2. Restrict Cross-Origin Requests (CORS Whitelist)
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

if (process.env.CLIENT_URL) {
  allowedOrigins.push(process.env.CLIENT_URL);
}

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (mobile/curl/Postman) or whitelisted origins
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked: Origin ${origin} not allowed`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

app.use(cors(corsOptions));

// 3. Request Body Parser with payload size limit
app.use(express.json({ limit: '50kb' }));

// 4. Prevent MongoDB NoSQL Injection
app.use(mongoSanitize);

// 5. Rate Limiting for all /api routes
app.use('/api', apiLimiter);

// Health check
app.get('/api/health', (req, res) => {
  const mongoose = require('mongoose');
  res.json({
    success: true,
    message: 'StockWise API is running',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

// Database readiness middleware
app.use('/api', (req, res, next) => {
  const mongoose = require('mongoose');
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message: 'MongoDB is not connected. Please ensure MongoDB is running or configure MONGODB_URI in server/.env',
    });
  }
  next();
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/inventory', require('./routes/inventoryRoutes'));
app.use('/api/sales', require('./routes/salesRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));

// Error handler (must be after routes)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`\n🚀 StockWise Server running on port ${PORT}`);
  console.log(`📡 API: http://localhost:${PORT}/api`);
  console.log(`💚 Health: http://localhost:${PORT}/api/health\n`);
});
