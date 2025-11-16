const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbotController');
const authMiddleware = require('../middlewares/authMiddleware');

/**
 * Rutas del Chatbot y Sistema de Recomendaciones
 * Todas las rutas requieren autenticación
 */

// Chatbot - Procesamiento de mensajes en lenguaje natural
router.post('/mensaje', authMiddleware, chatbotController.enviarMensaje);

// Búsqueda de películas
router.get('/buscar', authMiddleware, chatbotController.buscarPelicula);

// Recomendaciones personalizadas por cliente
router.get('/recomendaciones/:id_cliente', authMiddleware, chatbotController.obtenerRecomendaciones);

// Géneros favoritos del cliente
router.get('/generos-favoritos/:id_cliente', authMiddleware, chatbotController.obtenerGenerosFavoritos);

// Películas populares
router.get('/populares', authMiddleware, chatbotController.obtenerPopulares);

// Recomendaciones por género
router.get('/genero/:genero', authMiddleware, chatbotController.obtenerPorGenero);

// Estrenos recientes
router.get('/estrenos', authMiddleware, chatbotController.obtenerEstrenos);

// Películas similares
router.get('/similares/:id_pelicula', authMiddleware, chatbotController.obtenerSimilares);

// Disponibilidad de sillas para una función
router.get('/sillas/:id_funcion', authMiddleware, chatbotController.obtenerDisponibilidadSillas);

// Funciones disponibles para una película
router.get('/funciones/:id_pelicula', authMiddleware, chatbotController.obtenerFuncionesPelicula);

// Recomendaciones personalizadas con preferencias (día, horario)
router.get('/recomendaciones-personalizadas/:id_cliente', authMiddleware, chatbotController.obtenerRecomendacionesPersonalizadas);

module.exports = router;
