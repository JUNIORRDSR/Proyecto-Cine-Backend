const express = require('express');
const router = express.Router();
const {
  crearCliente,
  listarClientes,
  obtenerCliente,
  actualizarCliente,
  eliminarCliente
} = require('../controllers/clienteController');

const authMiddleware = require('../middlewares/authMiddleware');
const { isAdmin, isAdminOrCajero } = require('../middlewares/roleMiddleware');

/**
 * Rutas para Admin y Cajero (consulta y modificación)
 */

// GET /api/clientes - Listar clientes (con filtro opcional por tipo)
router.get('/', authMiddleware, isAdminOrCajero, listarClientes);

// GET /api/clientes/:id - Obtener un cliente
router.get('/:id', authMiddleware, isAdminOrCajero, obtenerCliente);

// POST /api/clientes - Crear cliente
router.post('/', authMiddleware, isAdminOrCajero, crearCliente);

// PUT /api/clientes/:id - Actualizar cliente
router.put('/:id', authMiddleware, isAdminOrCajero, actualizarCliente);

/**
 * Rutas solo para Admin (eliminación)
 */

// DELETE /api/clientes/:id - Eliminar cliente
router.delete('/:id', authMiddleware, isAdmin, eliminarCliente);

module.exports = router;
