const { Pelicula } = require('../models');
const logger = require('../utils/logger');
const { MOVIE_STATES } = require('../utils/constants');

/**
 * Crear una nueva película
 * Solo Admin
 */
const crearPelicula = async (req, res, next) => {
  try {
    const {
      titulo,
      descripcion,
      duracion_minutos,
      genero,
      clasificacion,
      idioma,
      director,
      reparto,
      fecha_estreno
    } = req.body;

    // Validar campos requeridos
    if (!titulo || !duracion_minutos || !genero || !clasificacion) {
      return res.status(400).json({
        success: false,
        message: 'Los campos titulo, duracion_minutos, genero y clasificacion son obligatorios'
      });
    }

    // Validar duración
    if (duracion_minutos <= 0 || duracion_minutos > 500) {
      return res.status(400).json({
        success: false,
        message: 'La duración debe estar entre 1 y 500 minutos'
      });
    }

    // Crear película con estado EN_CARTELERA por defecto
    const nuevaPelicula = await Pelicula.create({
      titulo,
      descripcion,
      duracion_minutos,
      genero,
      clasificacion,
      idioma,
      director,
      reparto,
      fecha_estreno,
      estado: MOVIE_STATES.EN_CARTELERA
    });

    logger.info(`Película creada: ${nuevaPelicula.titulo} (ID: ${nuevaPelicula.id_pelicula}) por usuario ${req.user.usuario}`);

    res.status(201).json({
      success: true,
      message: 'Película creada exitosamente',
      data: nuevaPelicula
    });

  } catch (error) {
    logger.error(`Error al crear película: ${error.message}`);
    next(error);
  }
};

/**
 * Listar todas las películas
 * Con filtro opcional por estado
 */
const listarPeliculas = async (req, res, next) => {
  try {
    const { estado } = req.query;

    const whereClause = {};
    
    // Filtrar por estado si se proporciona
    if (estado) {
      if (!Object.values(MOVIE_STATES).includes(estado)) {
        return res.status(400).json({
          success: false,
          message: `Estado inválido. Valores permitidos: ${Object.values(MOVIE_STATES).join(', ')}`
        });
      }
      whereClause.estado = estado;
    }

    const peliculas = await Pelicula.findAll({
      where: whereClause,
      order: [['fecha_estreno', 'DESC'], ['titulo', 'ASC']]
    });

    res.status(200).json({
      success: true,
      message: 'Películas obtenidas exitosamente',
      data: peliculas,
      count: peliculas.length
    });

  } catch (error) {
    logger.error(`Error al listar películas: ${error.message}`);
    next(error);
  }
};

/**
 * Obtener una película por ID
 */
const obtenerPelicula = async (req, res, next) => {
  try {
    const { id } = req.params;

    const pelicula = await Pelicula.findByPk(id);

    if (!pelicula) {
      return res.status(404).json({
        success: false,
        message: 'Película no encontrada'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Película obtenida exitosamente',
      data: pelicula
    });

  } catch (error) {
    logger.error(`Error al obtener película: ${error.message}`);
    next(error);
  }
};

/**
 * Actualizar una película
 * Solo Admin
 */
const actualizarPelicula = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      titulo,
      descripcion,
      duracion_minutos,
      genero,
      clasificacion,
      idioma,
      director,
      reparto,
      fecha_estreno,
      estado
    } = req.body;

    const pelicula = await Pelicula.findByPk(id);

    if (!pelicula) {
      return res.status(404).json({
        success: false,
        message: 'Película no encontrada'
      });
    }

    // Validar duración si se proporciona
    if (duracion_minutos !== undefined) {
      if (duracion_minutos <= 0 || duracion_minutos > 500) {
        return res.status(400).json({
          success: false,
          message: 'La duración debe estar entre 1 y 500 minutos'
        });
      }
    }

    // Validar estado si se proporciona
    if (estado && !Object.values(MOVIE_STATES).includes(estado)) {
      return res.status(400).json({
        success: false,
        message: `Estado inválido. Valores permitidos: ${Object.values(MOVIE_STATES).join(', ')}`
      });
    }

    // Actualizar solo los campos proporcionados
    const camposActualizados = {};
    if (titulo !== undefined) camposActualizados.titulo = titulo;
    if (descripcion !== undefined) camposActualizados.descripcion = descripcion;
    if (duracion_minutos !== undefined) camposActualizados.duracion_minutos = duracion_minutos;
    if (genero !== undefined) camposActualizados.genero = genero;
    if (clasificacion !== undefined) camposActualizados.clasificacion = clasificacion;
    if (idioma !== undefined) camposActualizados.idioma = idioma;
    if (director !== undefined) camposActualizados.director = director;
    if (reparto !== undefined) camposActualizados.reparto = reparto;
    if (fecha_estreno !== undefined) camposActualizados.fecha_estreno = fecha_estreno;
    if (estado !== undefined) camposActualizados.estado = estado;

    await pelicula.update(camposActualizados);

    logger.info(`Película actualizada: ${pelicula.titulo} (ID: ${id}) por usuario ${req.user.usuario}`);

    res.status(200).json({
      success: true,
      message: 'Película actualizada exitosamente',
      data: pelicula
    });

  } catch (error) {
    logger.error(`Error al actualizar película: ${error.message}`);
    next(error);
  }
};

/**
 * Eliminar película (soft delete)
 * Cambia el estado a RETIRADA
 * Solo Admin
 */
const eliminarPelicula = async (req, res, next) => {
  try {
    const { id } = req.params;

    const pelicula = await Pelicula.findByPk(id);

    if (!pelicula) {
      return res.status(404).json({
        success: false,
        message: 'Película no encontrada'
      });
    }

    // Soft delete: cambiar estado a RETIRADA
    await pelicula.update({ estado: MOVIE_STATES.RETIRADA });

    logger.info(`Película eliminada (soft delete): ${pelicula.titulo} (ID: ${id}) por usuario ${req.user.usuario}`);

    res.status(200).json({
      success: true,
      message: 'Película eliminada exitosamente',
      data: pelicula
    });

  } catch (error) {
    logger.error(`Error al eliminar película: ${error.message}`);
    next(error);
  }
};

module.exports = {
  crearPelicula,
  listarPeliculas,
  obtenerPelicula,
  actualizarPelicula,
  eliminarPelicula
};
