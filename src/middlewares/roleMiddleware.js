const { ROLES } = require('../utils/constants');
const logger = require('../utils/logger');

/**
 * Middleware to check if user is Admin
 */
const isAdmin = (req, res, next) => {
  try {
    if (!req.user || req.user.rol !== ROLES.ADMIN) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Acceso denegado. Se requiere rol de Administrador',
        },
      });
    }
    next();
  } catch (error) {
    logger.error('Error en verificación de rol:', error.message);
    next(error);
  }
};

/**
 * Middleware to check if user is Admin or Cajero
 */
const isAdminOrCajero = (req, res, next) => {
  try {
    if (!req.user || (req.user.rol !== ROLES.ADMIN && req.user.rol !== ROLES.CAJERO)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Acceso denegado. Se requiere rol de Administrador o Cajero',
        },
      });
    }
    next();
  } catch (error) {
    logger.error('Error en verificación de rol:', error.message);
    next(error);
  }
};

/**
 * Middleware to check if user is Cajero
 */
const isCajero = (req, res, next) => {
  try {
    if (!req.user || req.user.rol !== ROLES.CAJERO) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Acceso denegado. Se requiere rol de Cajero',
        },
      });
    }
    next();
  } catch (error) {
    logger.error('Error en verificación de rol:', error.message);
    next(error);
  }
};

module.exports = {
  isAdmin,
  isAdminOrCajero,
  isCajero,
};
