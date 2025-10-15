const ventaService = require('../services/ventaService');
const logger = require('../utils/logger');

/**
 * Crear venta directa (sin reserva previa)
 * Admin y Cajero
 */
const crearVentaDirecta = async (req, res, next) => {
  try {
    const { id_cliente, id_funcion, sillas } = req.body;

    // Validar campos requeridos
    if (!id_cliente || !id_funcion || !sillas || !Array.isArray(sillas) || sillas.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Los campos id_cliente, id_funcion y sillas (array) son obligatorios'
      });
    }

    const resultado = await ventaService.crearVentaDirecta(
      id_cliente,
      id_funcion,
      sillas,
      req.user.id_usuario
    );

    res.status(201).json({
      success: true,
      message: 'Venta creada exitosamente',
      data: resultado.venta,
      resumen: resultado.resumen
    });

  } catch (error) {
    logger.error(`Error en controller crearVentaDirecta: ${error.message}`);
    next(error);
  }
};

/**
 * Obtener historial de ventas
 * Admin y Cajero
 */
const obtenerHistorialVentas = async (req, res, next) => {
  try {
    const { fecha_inicio, fecha_fin, id_cliente, id_usuario, estado } = req.query;

    const ventas = await ventaService.obtenerHistorialVentas({
      fecha_inicio,
      fecha_fin,
      id_cliente,
      id_usuario,
      estado
    });

    res.status(200).json({
      success: true,
      message: 'Historial de ventas obtenido exitosamente',
      data: ventas,
      count: ventas.length
    });

  } catch (error) {
    logger.error(`Error en controller obtenerHistorialVentas: ${error.message}`);
    next(error);
  }
};

/**
 * Obtener detalle de una venta
 * Admin y Cajero
 */
const obtenerDetalleVenta = async (req, res, next) => {
  try {
    const { id } = req.params;

    const venta = await ventaService.obtenerDetalleVenta(parseInt(id));

    res.status(200).json({
      success: true,
      message: 'Detalle de venta obtenido exitosamente',
      data: venta
    });

  } catch (error) {
    logger.error(`Error en controller obtenerDetalleVenta: ${error.message}`);
    
    if (error.message.includes('no encontrada')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    next(error);
  }
};

/**
 * Obtener estadísticas de ventas
 * Solo Admin
 */
const obtenerEstadisticasVentas = async (req, res, next) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;

    const estadisticas = await ventaService.obtenerEstadisticasVentas(
      fecha_inicio,
      fecha_fin
    );

    res.status(200).json({
      success: true,
      message: 'Estadísticas obtenidas exitosamente',
      data: estadisticas
    });

  } catch (error) {
    logger.error(`Error en controller obtenerEstadisticasVentas: ${error.message}`);
    next(error);
  }
};

module.exports = {
  crearVentaDirecta,
  obtenerHistorialVentas,
  obtenerDetalleVenta,
  obtenerEstadisticasVentas
};
