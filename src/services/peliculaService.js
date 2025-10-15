const { Pelicula } = require('../models');
const { Op } = require('sequelize');

/**
 * Obtener todas las películas con filtros opcionales
 */
const listarPeliculas = async (filtros = {}) => {
  try {
    const where = {};

    // Filtrar por género
    if (filtros.genero) {
      where.genero = filtros.genero;
    }

    // Filtrar por clasificación
    if (filtros.clasificacion) {
      where.clasificacion = filtros.clasificacion;
    }

    // Filtrar por estado
    if (filtros.estado) {
      where.estado = filtros.estado;
    }

    const peliculas = await Pelicula.findAll({
      where,
      order: [['titulo', 'ASC']]
    });

    return peliculas;
  } catch (error) {
    throw new Error(`Error al obtener películas: ${error.message}`);
  }
};

/**
 * Obtener película por ID
 */
const obtenerPelicula = async (id, opciones = {}) => {
  try {
    const pelicula = await Pelicula.findByPk(id, opciones);

    if (!pelicula) {
      throw new Error('Película no encontrada');
    }

    return pelicula;
  } catch (error) {
    throw error;
  }
};

/**
 * Crear nueva película
 */
const crearPelicula = async (datosPelicula) => {
  try {
    const pelicula = await Pelicula.create(datosPelicula);
    return pelicula;
  } catch (error) {
    throw error;
  }
};

/**
 * Actualizar película
 */
const actualizarPelicula = async (id, datosActualizados) => {
  try {
    const pelicula = await Pelicula.findByPk(id);

    if (!pelicula) {
      throw new Error('Película no encontrada');
    }

    await pelicula.update(datosActualizados);
    await pelicula.reload();
    return pelicula;
  } catch (error) {
    throw error;
  }
};

/**
 * Eliminar película (soft delete)
 */
const eliminarPelicula = async (id) => {
  try {
    const pelicula = await Pelicula.findByPk(id);

    if (!pelicula) {
      throw new Error('Película no encontrada');
    }

    // Soft delete: cambiar estado a INACTIVA
    await pelicula.update({ estado: 'INACTIVA' });
    return pelicula;
  } catch (error) {
    throw error;
  }
};

/**
 * Buscar películas por título
 */
const buscarPorTitulo = async (termino) => {
  try {
    const peliculas = await Pelicula.findAll({
      where: {
        titulo: {
          [Op.like]: `%${termino}%`
        },
        estado: 'ACTIVA'
      },
      order: [['titulo', 'ASC']]
    });

    return peliculas;
  } catch (error) {
    throw new Error(`Error al buscar películas: ${error.message}`);
  }
};

module.exports = {
  listarPeliculas,
  obtenerPelicula,
  crearPelicula,
  actualizarPelicula,
  eliminarPelicula,
  buscarPorTitulo
};
