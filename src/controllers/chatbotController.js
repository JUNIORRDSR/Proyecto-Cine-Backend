const chatbotService = require('../services/chatbotService');
const recomendacionService = require('../services/recomendacionService');

/**
 * Procesar mensaje del chatbot
 */
const enviarMensaje = async (req, res, next) => {
  try {
    const { mensaje } = req.body;
    const id_cliente = req.body.id_cliente || null;

    if (!mensaje || mensaje.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'El mensaje no puede estar vacío'
      });
    }

    const respuesta = await chatbotService.procesarMensaje(mensaje, id_cliente);

    res.json({
      success: true,
      message: 'Mensaje procesado exitosamente',
      data: respuesta
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener recomendaciones personalizadas
 */
const obtenerRecomendaciones = async (req, res, next) => {
  try {
    const { id_cliente } = req.params;
    const { limite = 5 } = req.query;

    const recomendaciones = await recomendacionService.recomendarPorHistorial(
      parseInt(id_cliente),
      parseInt(limite)
    );

    res.json({
      success: true,
      message: 'Recomendaciones generadas exitosamente',
      data: recomendaciones
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener películas populares
 */
const obtenerPopulares = async (req, res, next) => {
  try {
    const { limite = 5 } = req.query;

    const populares = await recomendacionService.recomendarPopulares(parseInt(limite));

    res.json({
      success: true,
      message: 'Películas populares obtenidas exitosamente',
      data: populares
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener recomendaciones por género
 */
const obtenerPorGenero = async (req, res, next) => {
  try {
    const { genero } = req.params;
    const { limite = 5, id_cliente } = req.query;

    const recomendaciones = await recomendacionService.recomendarPorGenero(
      genero,
      parseInt(limite),
      id_cliente ? parseInt(id_cliente) : null
    );

    res.json({
      success: true,
      message: 'Recomendaciones por género obtenidas exitosamente',
      data: recomendaciones
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener estrenos recientes
 */
const obtenerEstrenos = async (req, res, next) => {
  try {
    const { dias = 30, limite = 5 } = req.query;

    const estrenos = await recomendacionService.obtenerEstrenos(
      parseInt(dias),
      parseInt(limite)
    );

    res.json({
      success: true,
      message: 'Estrenos obtenidos exitosamente',
      data: estrenos
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Buscar películas similares
 */
const obtenerSimilares = async (req, res, next) => {
  try {
    const { id_pelicula } = req.params;
    const { limite = 5 } = req.query;

    const similares = await recomendacionService.buscarSimilares(
      parseInt(id_pelicula),
      parseInt(limite)
    );

    res.json({
      success: true,
      message: 'Películas similares encontradas',
      data: similares
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Buscar película por título
 */
const buscarPelicula = async (req, res, next) => {
  try {
    const { titulo } = req.query;

    if (!titulo || titulo.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Debe proporcionar un título para buscar'
      });
    }

    const peliculas = await chatbotService.buscarPeliculaPorTitulo(titulo);

    res.json({
      success: true,
      message: peliculas.length > 0 
        ? 'Películas encontradas' 
        : 'No se encontraron películas con ese título',
      data: {
        cantidad: peliculas.length,
        peliculas
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener géneros favoritos del cliente
 */
const obtenerGenerosFavoritos = async (req, res, next) => {
  try {
    const { id_cliente } = req.params;

    const generos = await recomendacionService.obtenerGenerosFavoritos(
      parseInt(id_cliente)
    );

    res.json({
      success: true,
      message: 'Géneros favoritos obtenidos exitosamente',
      data: {
        generos,
        tiene_historial: generos.length > 0
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  enviarMensaje,
  obtenerRecomendaciones,
  obtenerPopulares,
  obtenerPorGenero,
  obtenerEstrenos,
  obtenerSimilares,
  buscarPelicula,
  obtenerGenerosFavoritos
};
