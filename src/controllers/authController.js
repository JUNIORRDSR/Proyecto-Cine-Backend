const authService = require('../services/authService');
const logger = require('../utils/logger');

/**
 * Login controller
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { usuario, contrasena } = req.body;

    // Validate required fields
    if (!usuario || !contrasena) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Usuario y contraseña son requeridos',
        },
      });
    }

    // Login user
    const result = await authService.login(usuario, contrasena);

    res.status(200).json({
      success: true,
      data: result,
      message: 'Login exitoso',
    });
  } catch (error) {
    if (error.message === 'Usuario o contraseña incorrectos') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: error.message,
        },
      });
    }
    next(error);
  }
};

/**
 * Register controller
 * POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const userData = req.body;

    // Create user
    const user = await authService.register(userData);

    res.status(201).json({
      success: true,
      data: user,
      message: 'Usuario registrado exitosamente',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user info
 * GET /api/auth/me
 */
const getCurrentUser = async (req, res, next) => {
  try {
    // User data is attached by authMiddleware
    const user = await authService.getUserById(req.user.id);

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  register,
  getCurrentUser,
};
