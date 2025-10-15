const express = require('express');
const router = express.Router();
const {
  crearVentaDirecta,
  obtenerHistorialVentas,
  obtenerDetalleVenta,
  obtenerEstadisticasVentas
} = require('../controllers/ventaController');

const authMiddleware = require('../middlewares/authMiddleware');
const { isAdmin, isAdminOrCajero } = require('../middlewares/roleMiddleware');

/**
 * Rutas para Admin y Cajero
 */

// POST /api/ventas - Crear venta directa (sin reserva previa)
router.post('/', authMiddleware, isAdminOrCajero, crearVentaDirecta);

// GET /api/ventas - Obtener historial de ventas (con filtros opcionales)
router.get('/', authMiddleware, isAdminOrCajero, obtenerHistorialVentas);

// GET /api/ventas/:id - Obtener detalle de una venta
router.get('/:id', authMiddleware, isAdminOrCajero, obtenerDetalleVenta);

/**
 * Rutas solo para Admin
 */

// GET /api/ventas/estadisticas/resumen - Obtener estadísticas de ventas
router.get('/estadisticas/resumen', authMiddleware, isAdmin, obtenerEstadisticasVentas);

module.exports = router;
