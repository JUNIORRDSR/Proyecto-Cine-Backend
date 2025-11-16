const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const configureServer = (app) => {
  // Security middleware
  app.use(helmet());

  // CORS configuration
  // Si CORS_ORIGIN está definido, usarlo; si no, usar los orígenes por defecto
  // IMPORTANTE: No usar '*' cuando credentials: true
  const getCorsOrigin = () => {
    if (process.env.CORS_ORIGIN) {
      // Si es un string con múltiples orígenes separados por coma, convertirlo a array
      if (process.env.CORS_ORIGIN.includes(',')) {
        return process.env.CORS_ORIGIN.split(',').map(origin => origin.trim());
      }
      // Si es '*', no usar credentials (solo para desarrollo)
      if (process.env.CORS_ORIGIN === '*') {
        return '*';
      }
      return process.env.CORS_ORIGIN;
    }
    // Orígenes por defecto para desarrollo
    return ['http://localhost:5173', 'http://localhost:3000'];
  };

  const corsOrigin = getCorsOrigin();
  
  const corsOptions = {
    origin: corsOrigin,
    credentials: corsOrigin !== '*', // No usar credentials si origin es '*'
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  };
  app.use(cors(corsOptions));

  // Body parser middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later',
      },
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(limiter);

  // Static files
  app.use('/tickets', express.static('public/tickets'));

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Server is running',
      timestamp: new Date().toISOString(),
    });
  });

  return app;
};

module.exports = configureServer;
