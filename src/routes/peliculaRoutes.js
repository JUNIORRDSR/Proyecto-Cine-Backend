const express = require('express');
const router = express.Router();
const {
  crearPelicula,
  listarPeliculas,
  obtenerPelicula,
  actualizarPelicula,
  eliminarPelicula
} = require('../controllers/peliculaController');

const authMiddleware = require('../middlewares/authMiddleware');
const { isAdmin } = require('../middlewares/roleMiddleware');

/**
 * Rutas públicas (autenticadas pero sin restricción de rol)
 */

// GET /api/peliculas - Listar películas (con filtro opcional por estado)
router.get('/', authMiddleware, listarPeliculas);

// GET /api/peliculas/:id - Obtener una película
router.get('/:id', authMiddleware, obtenerPelicula);

/**
 * Rutas protegidas - Solo Admin
 */

// POST /api/peliculas - Crear película
router.post('/', authMiddleware, isAdmin, crearPelicula);

// PUT /api/peliculas/:id - Actualizar película
router.put('/:id', authMiddleware, isAdmin, actualizarPelicula);

// DELETE /api/peliculas/:id - Eliminar película (soft delete)
router.delete('/:id', authMiddleware, isAdmin, eliminarPelicula);

module.exports = router;
