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

/**
 * @swagger
 * /api/peliculas:
 *   get:
 *     summary: Listar todas las películas
 *     description: Obtiene un listado de películas con filtro opcional por estado
 *     tags: [Películas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [ACTIVA, INACTIVA]
 *         description: Filtrar por estado de la película
 *     responses:
 *       200:
 *         description: Lista de películas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Pelicula'
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', authMiddleware, listarPeliculas);

/**
 * @swagger
 * /api/peliculas/{id}:
 *   get:
 *     summary: Obtener una película por ID
 *     description: Devuelve la información detallada de una película
 *     tags: [Películas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la película
 *     responses:
 *       200:
 *         description: Información de la película
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Pelicula'
 *       404:
 *         description: Película no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', authMiddleware, obtenerPelicula);

/**
 * Rutas protegidas - Solo Admin
 */

/**
 * @swagger
 * /api/peliculas:
 *   post:
 *     summary: Crear una nueva película
 *     description: Crea una película en el sistema (solo administradores)
 *     tags: [Películas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - titulo
 *               - director
 *               - duracion
 *               - genero
 *               - clasificacion
 *             properties:
 *               titulo:
 *                 type: string
 *                 example: Avatar: El Camino del Agua
 *               director:
 *                 type: string
 *                 example: James Cameron
 *               duracion:
 *                 type: integer
 *                 description: Duración en minutos
 *                 example: 192
 *               genero:
 *                 type: string
 *                 example: Ciencia Ficción
 *               clasificacion:
 *                 type: string
 *                 example: PG-13
 *               sinopsis:
 *                 type: string
 *                 example: Jake Sully vive con su nueva familia formada en el planeta de Pandora...
 *               fecha_estreno:
 *                 type: string
 *                 format: date
 *                 example: 2022-12-16
 *               estado:
 *                 type: string
 *                 enum: [ACTIVA, INACTIVA]
 *                 default: ACTIVA
 *                 example: ACTIVA
 *     responses:
 *       201:
 *         description: Película creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Pelicula'
 *                 message:
 *                   type: string
 *                   example: Película creada exitosamente
 *       400:
 *         description: Datos inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Prohibido - Se requiere rol de administrador
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', authMiddleware, isAdmin, crearPelicula);

/**
 * @swagger
 * /api/peliculas/{id}:
 *   put:
 *     summary: Actualizar una película
 *     description: Actualiza la información de una película (solo administradores)
 *     tags: [Películas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la película
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               titulo:
 *                 type: string
 *               director:
 *                 type: string
 *               duracion:
 *                 type: integer
 *               genero:
 *                 type: string
 *               clasificacion:
 *                 type: string
 *               sinopsis:
 *                 type: string
 *               fecha_estreno:
 *                 type: string
 *                 format: date
 *               estado:
 *                 type: string
 *                 enum: [ACTIVA, INACTIVA]
 *     responses:
 *       200:
 *         description: Película actualizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Pelicula'
 *                 message:
 *                   type: string
 *                   example: Película actualizada exitosamente
 *       404:
 *         description: Película no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Prohibido - Se requiere rol de administrador
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id', authMiddleware, isAdmin, actualizarPelicula);

/**
 * @swagger
 * /api/peliculas/{id}:
 *   delete:
 *     summary: Eliminar una película
 *     description: Elimina (soft delete) una película del sistema (solo administradores)
 *     tags: [Películas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la película
 *     responses:
 *       200:
 *         description: Película eliminada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Película eliminada exitosamente
 *       404:
 *         description: Película no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Prohibido - Se requiere rol de administrador
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', authMiddleware, isAdmin, eliminarPelicula);

module.exports = router;
