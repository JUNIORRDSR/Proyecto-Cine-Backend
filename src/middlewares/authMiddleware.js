const { verifyToken } = require('../config/jwt');
const logger = require('../utils/logger');

/**
 * Middleware to verify JWT token
 * Attaches user data to req.user if token is valid
 */
const authMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'NO_TOKEN',
          message: 'No se proporcionó token de autenticación',
        },
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = verifyToken(token);

    // Attach user data to request
    req.user = decoded;

    next();
  } catch (error) {
    logger.error('Error en autenticación:', error.message);
    return res.status(403).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Token inválido o expirado',
      },
    });
  }
};

module.exports = authMiddleware;
