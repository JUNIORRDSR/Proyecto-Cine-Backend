const reservaService = require('../services/reservaService');
const logger = require('../utils/logger');

/**
 * Crear una reserva
 * Admin y Cajero
 */
const crearReserva = async (req, res, next) => {
  try {
    const { id_cliente, id_funcion, sillas } = req.body;

    // Validar campos requeridos
    if (!id_cliente || !id_funcion || !sillas || !Array.isArray(sillas) || sillas.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Los campos id_cliente, id_funcion y sillas (array) son obligatorios'
      });
    }

    const reserva = await reservaService.crearReserva(
      id_cliente,
      id_funcion,
      sillas,
      req.user.id_usuario
    );

    res.status(201).json({
      success: true,
      message: `Reserva creada exitosamente. Expira en ${reservaService.RESERVA_TIEMPO_LIMITE_MINUTOS} minutos`,
      data: reserva,
      tiempo_limite_minutos: reservaService.RESERVA_TIEMPO_LIMITE_MINUTOS
    });

  } catch (error) {
    logger.error(`Error en controller crearReserva: ${error.message}`);
    next(error);
  }
};

/**
 * Confirmar reserva (convertir a venta pagada)
 * Admin y Cajero
 */
const confirmarReserva = async (req, res, next) => {
  try {
    const { id } = req.params;

    const venta = await reservaService.confirmarReserva(
      parseInt(id),
      req.user.id_usuario
    );

    res.status(200).json({
      success: true,
      message: 'Reserva confirmada y convertida a venta exitosamente',
      data: venta
    });

  } catch (error) {
    logger.error(`Error en controller confirmarReserva: ${error.message}`);
    
    if (error.message.includes('expirado')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    next(error);
  }
};

/**
 * Cancelar reserva
 * Admin y Cajero
 */
const cancelarReserva = async (req, res, next) => {
  try {
    const { id } = req.params;

    const reserva = await reservaService.cancelarReserva(
      parseInt(id),
      req.user.id_usuario
    );

    res.status(200).json({
      success: true,
      message: 'Reserva cancelada exitosamente. Las sillas han sido liberadas',
      data: reserva
    });

  } catch (error) {
    logger.error(`Error en controller cancelarReserva: ${error.message}`);
    next(error);
  }
};

/**
 * Obtener disponibilidad de sillas para una función
 * Autenticado
 */
const obtenerDisponibilidad = async (req, res, next) => {
  try {
    const { id_funcion } = req.params;

    const disponibilidad = await reservaService.obtenerDisponibilidadFuncion(
      parseInt(id_funcion)
    );

    res.status(200).json({
      success: true,
      message: 'Disponibilidad obtenida exitosamente',
      data: disponibilidad
    });

  } catch (error) {
    logger.error(`Error en controller obtenerDisponibilidad: ${error.message}`);
    next(error);
  }
};

/**
 * Limpiar reservas expiradas (endpoint manual o para cron job)
 * Solo Admin
 */
const limpiarReservasExpiradas = async (req, res, next) => {
  try {
    const canceladas = await reservaService.limpiarReservasExpiradas();

    res.status(200).json({
      success: true,
      message: `${canceladas} reservas expiradas han sido canceladas`,
      canceladas
    });

  } catch (error) {
    logger.error(`Error en controller limpiarReservasExpiradas: ${error.message}`);
    next(error);
  }
};

module.exports = {
  crearReserva,
  confirmarReserva,
  cancelarReserva,
  obtenerDisponibilidad,
  limpiarReservasExpiradas
};
