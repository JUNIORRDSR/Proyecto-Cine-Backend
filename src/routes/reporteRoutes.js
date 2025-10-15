const express = require('express');
const router = express.Router();
const {
  reporteVentasPorPelicula,
  reporteVentasPorFecha,
  reporteClientesVIP,
  reporteOcupacionSalas,
  obtenerLogs,
  reporteActividadUsuarios,
  reporteErrores,
  reporteEstadisticasGenerales
} = require('../controllers/reporteController');

const authMiddleware = require('../middlewares/authMiddleware');
const { isAdmin } = require('../middlewares/roleMiddleware');

/**
 * Todas las rutas de reportes requieren autenticación y rol Admin
 */

// GET /api/reportes/ventas/por-pelicula - Reporte de ventas por película
router.get('/ventas/por-pelicula', authMiddleware, isAdmin, reporteVentasPorPelicula);

// GET /api/reportes/ventas/por-fecha - Reporte de ventas por fecha
router.get('/ventas/por-fecha', authMiddleware, isAdmin, reporteVentasPorFecha);

// GET /api/reportes/clientes/vip - Reporte de clientes VIP y top clientes
router.get('/clientes/vip', authMiddleware, isAdmin, reporteClientesVIP);

// GET /api/reportes/salas/ocupacion - Reporte de ocupación de salas
router.get('/salas/ocupacion', authMiddleware, isAdmin, reporteOcupacionSalas);

// GET /api/reportes/logs - Obtener logs del sistema
router.get('/logs', authMiddleware, isAdmin, obtenerLogs);

// GET /api/reportes/logs/actividad - Reporte de actividad de usuarios
router.get('/logs/actividad', authMiddleware, isAdmin, reporteActividadUsuarios);

// GET /api/reportes/logs/errores - Reporte de errores del sistema
router.get('/logs/errores', authMiddleware, isAdmin, reporteErrores);

// GET /api/reportes/estadisticas/generales - Estadísticas generales del sistema
router.get('/estadisticas/generales', authMiddleware, isAdmin, reporteEstadisticasGenerales);

module.exports = router;
