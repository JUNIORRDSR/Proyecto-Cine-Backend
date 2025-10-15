const logger = require('../utils/logger');

const errorHandler = (err, req, res, _next) => {
  // Log error
  logger.error(`${err.name}: ${err.message}`);
  logger.error(err.stack);

  // Default error
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let code = err.code || 'SERVER_ERROR';

  // Handle specific error types
  if (err.name === 'SequelizeValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = err.errors.map(e => e.message).join(', ');
  } else if (err.name === 'SequelizeUniqueConstraintError') {
    statusCode = 409;
    code = 'DUPLICATE_ERROR';
    message = 'Resource already exists';
  } else if (err.name === 'SequelizeDatabaseError') {
    statusCode = 500;
    code = 'DATABASE_ERROR';
    message = 'Database error occurred';
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 403;
    code = 'INVALID_TOKEN';
    message = 'Invalid or expired token';
  } else if (err.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
  }

  // Send response
  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
};

// 404 handler
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
};

module.exports = { errorHandler, notFoundHandler };
