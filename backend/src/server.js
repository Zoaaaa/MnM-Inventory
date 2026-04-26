const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const config = require('./config');
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/auth');
const categoryRoutes = require('./routes/categories');
const productRoutes = require('./routes/products');
const featuredRoutes = require('./routes/featured');

const app = express();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files (for uploaded images in the future)
app.use('/uploads', express.static(uploadsDir));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'MnM Inventory API is running',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/featured', featuredRoutes);

// Messenger config endpoint (public)
app.get('/api/config/messenger', (req, res) => {
  res.json({
    success: true,
    data: {
      pageId: config.messenger.pageId,
      defaultMessage: config.messenger.defaultMessage,
    },
  });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start server
app.listen(config.port, () => {
  console.log(`
  🚀 MnM Inventory API Server
  ============================
  Environment: ${config.nodeEnv}
  Port:        ${config.port}
  Frontend:    ${config.frontendUrl}
  API:         http://localhost:${config.port}/api
  Health:      http://localhost:${config.port}/api/health
  ============================
  `);
});

module.exports = app;
