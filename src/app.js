require('dotenv').config();
const express = require('express');
const { testConnection } = require('./config/database');
const configureServer = require('./config/server');
const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 3000;

// Configure server middleware
configureServer(app);

// Import routes
const authRoutes = require('./routes/authRoutes');
const peliculaRoutes = require('./routes/peliculaRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes');
const clienteRoutes = require('./routes/clienteRoutes');
const funcionRoutes = require('./routes/funcionRoutes');
const reservaRoutes = require('./routes/reservaRoutes');
const ventaRoutes = require('./routes/ventaRoutes');
const reporteRoutes = require('./routes/reporteRoutes');
const logMiddleware = require('./middlewares/logMiddleware');

// Apply log middleware globally
app.use(logMiddleware);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/peliculas', peliculaRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/funciones', funcionRoutes);
app.use('/api/reservas', reservaRoutes);
app.use('/api/ventas', ventaRoutes);
app.use('/api/reportes', reporteRoutes);

// 404 handler - must be after all routes
app.use(notFoundHandler);

// Error handling middleware - must be last
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Test database connection
    const isConnected = await testConnection();
    
    if (!isConnected) {
      logger.error('Failed to connect to database. Server will not start.');
      process.exit(1);
    }

    // Start listening
    const server = app.listen(PORT, () => {
      logger.info(`🚀 Server is running on port ${PORT}`);
      logger.info(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM signal received: closing HTTP server');
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });
    });

    return server;
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start server if not in test environment
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = { app, startServer };
