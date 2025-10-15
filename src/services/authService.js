const Usuario = require('../models/Usuario');
const { generateToken } = require('../config/jwt');
const logger = require('../utils/logger');

/**
 * Login user and generate JWT token
 * @param {string} usuario - Username
 * @param {string} contrasena - Password
 * @returns {object} - User data and token
 */
const login = async (usuario, contrasena) => {
  try {
    // Find user by username
    const user = await Usuario.findOne({
      where: { usuario },
    });

    if (!user) {
      throw new Error('Usuario o contraseña incorrectos');
    }

    // Validate password
    const isValidPassword = await user.validarContrasena(contrasena);

    if (!isValidPassword) {
      throw new Error('Usuario o contraseña incorrectos');
    }

    // Generate JWT token
    const token = generateToken({
      id: user.id_usuario,
      usuario: user.usuario,
      rol: user.rol,
    });

    // Return user data (without password)
    return {
      token,
      user: {
        id_usuario: user.id_usuario,
        nombre: user.nombre,
        usuario: user.usuario,
        rol: user.rol,
      },
    };
  } catch (error) {
    logger.error('Error en login:', error.message);
    throw error;
  }
};

/**
 * Register new user (only Admin can register cajeros)
 * @param {object} userData - User data
 * @returns {object} - Created user
 */
const register = async (userData) => {
  try {
    // Create user (password will be hashed by model hook)
    const user = await Usuario.create({
      nombre: userData.nombre,
      usuario: userData.usuario,
      contrasena: userData.contrasena,
      rol: userData.rol || 'CAJERO',
    });

    logger.info(`Nuevo usuario registrado: ${user.usuario}`);

    // Return user data (without password)
    return {
      id_usuario: user.id_usuario,
      nombre: user.nombre,
      usuario: user.usuario,
      rol: user.rol,
      fecha_creacion: user.fecha_creacion,
    };
  } catch (error) {
    logger.error('Error en registro:', error.message);
    throw error;
  }
};

/**
 * Get user by ID
 * @param {number} id_usuario - User ID
 * @returns {object} - User data
 */
const getUserById = async (id_usuario) => {
  try {
    const user = await Usuario.findByPk(id_usuario, {
      attributes: ['id_usuario', 'nombre', 'usuario', 'rol', 'fecha_creacion'],
    });

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    return user;
  } catch (error) {
    logger.error('Error al obtener usuario:', error.message);
    throw error;
  }
};

module.exports = {
  login,
  register,
  getUserById,
};
