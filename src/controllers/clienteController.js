const { Cliente } = require('../models');
const logger = require('../utils/logger');
const { CLIENT_TYPES } = require('../utils/constants');

/**
 * Crear un nuevo cliente
 * Admin y Cajero
 */
const crearCliente = async (req, res, next) => {
  try {
    const {
      nombre,
      documento,
      email,
      telefono,
      tipo_cliente
    } = req.body;

    // Validar campos requeridos
    if (!nombre || !documento || !email) {
      return res.status(400).json({
        success: false,
        message: 'Los campos nombre, documento y email son obligatorios'
      });
    }

    // Validar tipo de cliente si se proporciona
    if (tipo_cliente && !Object.values(CLIENT_TYPES).includes(tipo_cliente)) {
      return res.status(400).json({
        success: false,
        message: `Tipo de cliente inválido. Valores permitidos: ${Object.values(CLIENT_TYPES).join(', ')}`
      });
    }

    // Verificar si el email ya existe
    const emailExistente = await Cliente.findOne({ where: { email } });
    if (emailExistente) {
      return res.status(400).json({
        success: false,
        message: 'El email ya está registrado'
      });
    }

    // Crear cliente con tipo NORMAL por defecto
    const nuevoCliente = await Cliente.create({
      nombre,
      documento,
      email,
      telefono,
      tipo_cliente: tipo_cliente || CLIENT_TYPES.NORMAL
    });

    logger.info(`Cliente creado: ${nuevoCliente.nombre} (ID: ${nuevoCliente.id_cliente}) por ${req.user.usuario}`);

    res.status(201).json({
      success: true,
      message: 'Cliente creado exitosamente',
      data: nuevoCliente
    });

  } catch (error) {
    logger.error(`Error al crear cliente: ${error.message}`);
    next(error);
  }
};

/**
 * Listar todos los clientes
 * Con filtro opcional por tipo_cliente
 * Admin y Cajero
 */
const listarClientes = async (req, res, next) => {
  try {
    const { tipo_cliente } = req.query;

    const whereClause = {};
    
    // Filtrar por tipo si se proporciona
    if (tipo_cliente) {
      if (!Object.values(CLIENT_TYPES).includes(tipo_cliente)) {
        return res.status(400).json({
          success: false,
          message: `Tipo de cliente inválido. Valores permitidos: ${Object.values(CLIENT_TYPES).join(', ')}`
        });
      }
      whereClause.tipo_cliente = tipo_cliente;
    }

    const clientes = await Cliente.findAll({
      where: whereClause,
      order: [['nombre', 'ASC']]
    });

    res.status(200).json({
      success: true,
      message: 'Clientes obtenidos exitosamente',
      data: clientes,
      count: clientes.length
    });

  } catch (error) {
    logger.error(`Error al listar clientes: ${error.message}`);
    next(error);
  }
};

/**
 * Obtener un cliente por ID
 * Admin y Cajero
 */
const obtenerCliente = async (req, res, next) => {
  try {
    const { id } = req.params;

    const cliente = await Cliente.findByPk(id);

    if (!cliente) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Cliente obtenido exitosamente',
      data: cliente
    });

  } catch (error) {
    logger.error(`Error al obtener cliente: ${error.message}`);
    next(error);
  }
};

/**
 * Actualizar un cliente
 * Admin y Cajero
 */
const actualizarCliente = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      nombre,
      documento,
      email,
      telefono,
      tipo_cliente
    } = req.body;

    const cliente = await Cliente.findByPk(id);

    if (!cliente) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    // Validar tipo de cliente si se proporciona
    if (tipo_cliente && !Object.values(CLIENT_TYPES).includes(tipo_cliente)) {
      return res.status(400).json({
        success: false,
        message: `Tipo de cliente inválido. Valores permitidos: ${Object.values(CLIENT_TYPES).join(', ')}`
      });
    }

    // Verificar unicidad de email si se cambia
    if (email && email !== cliente.email) {
      const emailYaExiste = await Cliente.findOne({ where: { email } });
      if (emailYaExiste) {
        return res.status(400).json({
          success: false,
          message: 'El email ya está registrado'
        });
      }
    }

    // Actualizar solo los campos proporcionados
    const camposActualizados = {};
    if (nombre !== undefined) camposActualizados.nombre = nombre;
    if (documento !== undefined) camposActualizados.documento = documento;
    if (email !== undefined) camposActualizados.email = email;
    if (telefono !== undefined) camposActualizados.telefono = telefono;
    if (tipo_cliente !== undefined) camposActualizados.tipo_cliente = tipo_cliente;

    await cliente.update(camposActualizados);

    logger.info(`Cliente actualizado: ${cliente.nombre} (ID: ${id}) por ${req.user.usuario}`);

    res.status(200).json({
      success: true,
      message: 'Cliente actualizado exitosamente',
      data: cliente
    });

  } catch (error) {
    logger.error(`Error al actualizar cliente: ${error.message}`);
    next(error);
  }
};

/**
 * Eliminar un cliente
 * Solo Admin
 */
const eliminarCliente = async (req, res, next) => {
  try {
    const { id } = req.params;

    const cliente = await Cliente.findByPk(id);

    if (!cliente) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    await cliente.destroy();

    logger.info(`Cliente eliminado: ${cliente.nombre} (ID: ${id}) por ${req.user.usuario}`);

    res.status(200).json({
      success: true,
      message: 'Cliente eliminado exitosamente'
    });

  } catch (error) {
    logger.error(`Error al eliminar cliente: ${error.message}`);
    next(error);
  }
};

module.exports = {
  crearCliente,
  listarClientes,
  obtenerCliente,
  actualizarCliente,
  eliminarCliente
};
