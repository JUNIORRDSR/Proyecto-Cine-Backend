const express = require('express');
const router = express.Router();
const {
  crearUsuario,
  listarUsuarios,
  obtenerUsuario,
  actualizarUsuario,
  eliminarUsuario
} = require('../controllers/usuarioController');

const authMiddleware = require('../middlewares/authMiddleware');
const { isAdmin } = require('../middlewares/roleMiddleware');

/**
 * Todas las rutas de usuarios requieren autenticación y rol Admin
 */

// GET /api/usuarios - Listar usuarios (con filtro opcional por rol)
router.get('/', authMiddleware, isAdmin, listarUsuarios);

// GET /api/usuarios/:id - Obtener un usuario
router.get('/:id', authMiddleware, isAdmin, obtenerUsuario);

// POST /api/usuarios - Crear usuario
router.post('/', authMiddleware, isAdmin, crearUsuario);

// PUT /api/usuarios/:id - Actualizar usuario
router.put('/:id', authMiddleware, isAdmin, actualizarUsuario);

// DELETE /api/usuarios/:id - Eliminar usuario
router.delete('/:id', authMiddleware, isAdmin, eliminarUsuario);

module.exports = router;
