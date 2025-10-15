const express = require('express');
const router = express.Router();
const {
  crearFuncion,
  listarFunciones,
  obtenerFuncion,
  actualizarFuncion,
  eliminarFuncion
} = require('../controllers/funcionController');

const authMiddleware = require('../middlewares/authMiddleware');
const { isAdmin } = require('../middlewares/roleMiddleware');

/**
 * Rutas públicas (autenticadas)
 */

// GET /api/funciones - Listar funciones (con filtros opcionales: fecha, id_pelicula, id_sala)
router.get('/', authMiddleware, listarFunciones);

// GET /api/funciones/:id - Obtener una función
router.get('/:id', authMiddleware, obtenerFuncion);

/**
 * Rutas protegidas - Solo Admin
 */

// POST /api/funciones - Crear función
router.post('/', authMiddleware, isAdmin, crearFuncion);

// PUT /api/funciones/:id - Actualizar función
router.put('/:id', authMiddleware, isAdmin, actualizarFuncion);

// DELETE /api/funciones/:id - Eliminar función
router.delete('/:id', authMiddleware, isAdmin, eliminarFuncion);

module.exports = router;
