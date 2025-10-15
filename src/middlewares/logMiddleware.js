const LogUsuario = require('../models/LogUsuario');
const logger = require('../utils/logger');

/**
 * Middleware to log user actions
 * Records action, timestamp, and duration
 */
const logMiddleware = async (req, res, next) => {
  // Only log if user is authenticated
  if (!req.user) {
    return next();
  }

  const startTime = Date.now();

  // Capture the original res.json function
  const originalJson = res.json.bind(res);

  // Override res.json to log after response is sent
  res.json = function(body) {
    // Calculate duration
    const duration = Math.floor((Date.now() - startTime) / 1000);

    // Log action to database (async, don't wait)
    LogUsuario.create({
      id_usuario: req.user.id,
      accion: `${req.method} ${req.path}`,
      fecha: new Date(),
      duracion_segundos: duration,
      detalles: JSON.stringify({
        method: req.method,
        path: req.path,
        query: req.query,
        statusCode: res.statusCode,
      }),
    }).catch((error) => {
      logger.error('Error al guardar log de usuario:', error.message);
    });

    // Call the original res.json
    return originalJson(body);
  };

  next();
};

module.exports = logMiddleware;
