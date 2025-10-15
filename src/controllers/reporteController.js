const reporteService = require('../services/reporteService');
const logService = require('../services/logService');
const logger = require('../utils/logger');

/**
 * Reporte de ventas por película
 * Solo Admin
 */
const reporteVentasPorPelicula = async (req, res, next) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;

    const reporte = await reporteService.reporteVentasPorPelicula(fecha_inicio, fecha_fin);

    res.status(200).json({
      success: true,
      message: 'Reporte de ventas por película generado exitosamente',
      data: reporte
    });

  } catch (error) {
    logger.error(`Error en controller reporteVentasPorPelicula: ${error.message}`);
    next(error);
  }
};

/**
 * Reporte de ventas por fecha
 * Solo Admin
 */
const reporteVentasPorFecha = async (req, res, next) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;

    const reporte = await reporteService.reporteVentasPorFecha(fecha_inicio, fecha_fin);

    res.status(200).json({
      success: true,
      message: 'Reporte de ventas por fecha generado exitosamente',
      data: reporte
    });

  } catch (error) {
    logger.error(`Error en controller reporteVentasPorFecha: ${error.message}`);
    next(error);
  }
};

/**
 * Reporte de clientes VIP y top clientes
 * Solo Admin
 */
const reporteClientesVIP = async (req, res, next) => {
  try {
    const { fecha_inicio, fecha_fin, limite } = req.query;

    const reporte = await reporteService.reporteClientesVIP(
      fecha_inicio,
      fecha_fin,
      limite ? parseInt(limite) : 20
    );

    res.status(200).json({
      success: true,
      message: 'Reporte de clientes VIP generado exitosamente',
      data: reporte
    });

  } catch (error) {
    logger.error(`Error en controller reporteClientesVIP: ${error.message}`);
    next(error);
  }
};

/**
 * Reporte de ocupación de salas
 * Solo Admin
 */
const reporteOcupacionSalas = async (req, res, next) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;

    const reporte = await reporteService.reporteOcupacionSalas(fecha_inicio, fecha_fin);

    res.status(200).json({
      success: true,
      message: 'Reporte de ocupación de salas generado exitosamente',
      data: reporte
    });

  } catch (error) {
    logger.error(`Error en controller reporteOcupacionSalas: ${error.message}`);
    next(error);
  }
};

/**
 * Obtener logs del sistema
 * Solo Admin
 */
const obtenerLogs = async (req, res, next) => {
  try {
    const { fecha_inicio, fecha_fin, id_usuario, metodo, ruta, limite } = req.query;

    const logs = await logService.obtenerLogs({
      fecha_inicio,
      fecha_fin,
      id_usuario,
      metodo,
      ruta,
      limite
    });

    res.status(200).json({
      success: true,
      message: 'Logs obtenidos exitosamente',
      data: logs,
      count: logs.length
    });

  } catch (error) {
    logger.error(`Error en controller obtenerLogs: ${error.message}`);
    next(error);
  }
};

/**
 * Reporte de actividad de usuarios
 * Solo Admin
 */
const reporteActividadUsuarios = async (req, res, next) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;

    const reporte = await logService.reporteActividadUsuarios(fecha_inicio, fecha_fin);

    res.status(200).json({
      success: true,
      message: 'Reporte de actividad de usuarios generado exitosamente',
      data: reporte
    });

  } catch (error) {
    logger.error(`Error en controller reporteActividadUsuarios: ${error.message}`);
    next(error);
  }
};

/**
 * Reporte de errores del sistema
 * Solo Admin
 */
const reporteErrores = async (req, res, next) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;

    const reporte = await logService.reporteErrores(fecha_inicio, fecha_fin);

    res.status(200).json({
      success: true,
      message: 'Reporte de errores generado exitosamente',
      data: reporte
    });

  } catch (error) {
    logger.error(`Error en controller reporteErrores: ${error.message}`);
    next(error);
  }
};

/**
 * Estadísticas generales del sistema
 * Solo Admin
 */
const reporteEstadisticasGenerales = async (req, res, next) => {
  try {
    const estadisticas = await logService.reporteEstadisticasGenerales();

    res.status(200).json({
      success: true,
      message: 'Estadísticas generales obtenidas exitosamente',
      data: estadisticas
    });

  } catch (error) {
    logger.error(`Error en controller reporteEstadisticasGenerales: ${error.message}`);
    next(error);
  }
};

module.exports = {
  reporteVentasPorPelicula,
  reporteVentasPorFecha,
  reporteClientesVIP,
  reporteOcupacionSalas,
  obtenerLogs,
  reporteActividadUsuarios,
  reporteErrores,
  reporteEstadisticasGenerales
};
