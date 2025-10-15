const { Usuario } = require('../models');
const logger = require('../utils/logger');
const { ROLES } = require('../utils/constants');

/**
 * Crear un nuevo usuario (Admin o Cajero)
 * Solo Admin
 */
const crearUsuario = async (req, res, next) => {
  try {
    const {
      usuario,
      contrasena,
      nombre,
      email,
      rol
    } = req.body;

    // Validar campos requeridos
    if (!usuario || !contrasena || !nombre || !email || !rol) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son obligatorios: usuario, contrasena, nombre, email, rol'
      });
    }

    // Validar que el rol sea válido
    if (!Object.values(ROLES).includes(rol)) {
      return res.status(400).json({
        success: false,
        message: `Rol inválido. Valores permitidos: ${Object.values(ROLES).join(', ')}`
      });
    }

    // Validar longitud mínima de contraseña
    if (contrasena.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    // Verificar si el usuario ya existe
    const usuarioExistente = await Usuario.findOne({ where: { usuario } });
    if (usuarioExistente) {
      return res.status(400).json({
        success: false,
        message: 'El nombre de usuario ya existe'
      });
    }

    // Verificar si el email ya existe
    const emailExistente = await Usuario.findOne({ where: { email } });
    if (emailExistente) {
      return res.status(400).json({
        success: false,
        message: 'El email ya está registrado'
      });
    }

    // Crear usuario
    const nuevoUsuario = await Usuario.create({
      usuario,
      contrasena, // Se hashea automáticamente en el hook beforeCreate
      nombre,
      email,
      rol
    });

    // Excluir contraseña de la respuesta
    const usuarioSinContrasena = nuevoUsuario.toJSON();
    delete usuarioSinContrasena.contrasena;

    logger.info(`Usuario creado: ${nuevoUsuario.usuario} (ID: ${nuevoUsuario.id_usuario}, Rol: ${rol}) por ${req.user.usuario}`);

    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      data: usuarioSinContrasena
    });

  } catch (error) {
    logger.error(`Error al crear usuario: ${error.message}`);
    next(error);
  }
};

/**
 * Listar todos los usuarios
 * Con filtro opcional por rol
 * Solo Admin
 */
const listarUsuarios = async (req, res, next) => {
  try {
    const { rol } = req.query;

    const whereClause = {};
    
    // Filtrar por rol si se proporciona
    if (rol) {
      if (!Object.values(ROLES).includes(rol)) {
        return res.status(400).json({
          success: false,
          message: `Rol inválido. Valores permitidos: ${Object.values(ROLES).join(', ')}`
        });
      }
      whereClause.rol = rol;
    }

    const usuarios = await Usuario.findAll({
      where: whereClause,
      attributes: { exclude: ['contrasena'] }, // Excluir contraseña
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      message: 'Usuarios obtenidos exitosamente',
      data: usuarios,
      count: usuarios.length
    });

  } catch (error) {
    logger.error(`Error al listar usuarios: ${error.message}`);
    next(error);
  }
};

/**
 * Obtener un usuario por ID
 * Solo Admin
 */
const obtenerUsuario = async (req, res, next) => {
  try {
    const { id } = req.params;

    const usuario = await Usuario.findByPk(id, {
      attributes: { exclude: ['contrasena'] }
    });

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Usuario obtenido exitosamente',
      data: usuario
    });

  } catch (error) {
    logger.error(`Error al obtener usuario: ${error.message}`);
    next(error);
  }
};

/**
 * Actualizar un usuario
 * Solo Admin
 */
const actualizarUsuario = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      usuario,
      contrasena,
      nombre,
      email,
      rol
    } = req.body;

    const usuarioExistente = await Usuario.findByPk(id);

    if (!usuarioExistente) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Prevenir que el único admin se cambie a cajero
    if (usuarioExistente.rol === ROLES.ADMIN && rol === ROLES.CAJERO) {
      const adminCount = await Usuario.count({ where: { rol: ROLES.ADMIN } });
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'No se puede cambiar el rol del único administrador'
        });
      }
    }

    // Validar rol si se proporciona
    if (rol && !Object.values(ROLES).includes(rol)) {
      return res.status(400).json({
        success: false,
        message: `Rol inválido. Valores permitidos: ${Object.values(ROLES).join(', ')}`
      });
    }

    // Validar longitud de contraseña si se proporciona
    if (contrasena && contrasena.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    // Verificar unicidad de usuario si se cambia
    if (usuario && usuario !== usuarioExistente.usuario) {
      const usuarioYaExiste = await Usuario.findOne({ where: { usuario } });
      if (usuarioYaExiste) {
        return res.status(400).json({
          success: false,
          message: 'El nombre de usuario ya existe'
        });
      }
    }

    // Verificar unicidad de email si se cambia
    if (email && email !== usuarioExistente.email) {
      const emailYaExiste = await Usuario.findOne({ where: { email } });
      if (emailYaExiste) {
        return res.status(400).json({
          success: false,
          message: 'El email ya está registrado'
        });
      }
    }

    // Actualizar solo los campos proporcionados
    const camposActualizados = {};
    if (usuario !== undefined) camposActualizados.usuario = usuario;
    if (contrasena !== undefined) camposActualizados.contrasena = contrasena; // Se hashea en hook beforeUpdate
    if (nombre !== undefined) camposActualizados.nombre = nombre;
    if (email !== undefined) camposActualizados.email = email;
    if (rol !== undefined) camposActualizados.rol = rol;

    await usuarioExistente.update(camposActualizados);

    // Excluir contraseña de la respuesta
    const usuarioActualizado = usuarioExistente.toJSON();
    delete usuarioActualizado.contrasena;

    logger.info(`Usuario actualizado: ${usuarioExistente.usuario} (ID: ${id}) por ${req.user.usuario}`);

    res.status(200).json({
      success: true,
      message: 'Usuario actualizado exitosamente',
      data: usuarioActualizado
    });

  } catch (error) {
    logger.error(`Error al actualizar usuario: ${error.message}`);
    next(error);
  }
};

/**
 * Eliminar un usuario
 * Solo Admin
 * No permite eliminar el último admin
 */
const eliminarUsuario = async (req, res, next) => {
  try {
    const { id } = req.params;

    const usuario = await Usuario.findByPk(id);

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Prevenir eliminar el último admin
    if (usuario.rol === ROLES.ADMIN) {
      const adminCount = await Usuario.count({ where: { rol: ROLES.ADMIN } });
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'No se puede eliminar el único administrador del sistema'
        });
      }
    }

    // Prevenir que un admin se elimine a sí mismo
    if (usuario.id_usuario === req.user.id_usuario) {
      return res.status(400).json({
        success: false,
        message: 'No puedes eliminar tu propia cuenta'
      });
    }

    await usuario.destroy();

    logger.info(`Usuario eliminado: ${usuario.usuario} (ID: ${id}) por ${req.user.usuario}`);

    res.status(200).json({
      success: true,
      message: 'Usuario eliminado exitosamente'
    });

  } catch (error) {
    logger.error(`Error al eliminar usuario: ${error.message}`);
    next(error);
  }
};

module.exports = {
  crearUsuario,
  listarUsuarios,
  obtenerUsuario,
  actualizarUsuario,
  eliminarUsuario
};
