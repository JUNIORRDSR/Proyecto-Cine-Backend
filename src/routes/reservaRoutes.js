const express = require('express');
const router = express.Router();
const {
  crearReserva,
  confirmarReserva,
  cancelarReserva,
  obtenerDisponibilidad,
  limpiarReservasExpiradas
} = require('../controllers/reservaController');

const authMiddleware = require('../middlewares/authMiddleware');
const { isAdmin, isAdminOrCajero } = require('../middlewares/roleMiddleware');

/**
 * Rutas para Admin y Cajero
 */

// POST /api/reservas - Crear reserva
router.post('/', authMiddleware, isAdminOrCajero, crearReserva);

// PUT /api/reservas/:id/confirmar - Confirmar reserva (convertir a venta)
router.put('/:id/confirmar', authMiddleware, isAdminOrCajero, confirmarReserva);

// PUT /api/reservas/:id/cancelar - Cancelar reserva
router.put('/:id/cancelar', authMiddleware, isAdminOrCajero, cancelarReserva);

/**
 * Rutas para todos los usuarios autenticados
 */

// GET /api/reservas/disponibilidad/:id_funcion - Ver disponibilidad de sillas
router.get('/disponibilidad/:id_funcion', authMiddleware, obtenerDisponibilidad);

/**
 * Rutas de mantenimiento - Solo Admin
 */

// POST /api/reservas/limpiar-expiradas - Limpiar reservas expiradas manualmente
router.post('/limpiar-expiradas', authMiddleware, isAdmin, limpiarReservasExpiradas);

module.exports = router;
