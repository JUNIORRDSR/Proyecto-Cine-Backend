const { Funcion, Pelicula, Sala } = require('../models');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

/**
 * Crear una nueva función (horario de proyección)
 * Solo Admin
 */
const crearFuncion = async (req, res, next) => {
  try {
    const {
      id_pelicula,
      id_sala,
      fecha,
      hora_inicio,
      precio_base
    } = req.body;

    // Validar campos requeridos
    if (!id_pelicula || !id_sala || !fecha || !hora_inicio || !precio_base) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son obligatorios: id_pelicula, id_sala, fecha, hora_inicio, precio_base'
      });
    }

    // Validar que precio_base sea positivo
    if (precio_base <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El precio base debe ser mayor a 0'
      });
    }

    // Verificar que la película existe
    const pelicula = await Pelicula.findByPk(id_pelicula);
    if (!pelicula) {
      return res.status(404).json({
        success: false,
        message: 'Película no encontrada'
      });
    }

    // Verificar que la sala existe
    const sala = await Sala.findByPk(id_sala);
    if (!sala) {
      return res.status(404).json({
        success: false,
        message: 'Sala no encontrada'
      });
    }

    // Verificar que la sala está activa
    if (sala.estado !== 'ACTIVA') {
      return res.status(400).json({
        success: false,
        message: `La sala no está activa (Estado actual: ${sala.estado})`
      });
    }

    // Calcular hora de fin basado en duración de película + 15 min de limpieza
    const duracionTotal = pelicula.duracion_minutos + 15;
    const horaFin = calcularHoraFin(hora_inicio, duracionTotal);

    // Verificar conflictos de horario en la misma sala y fecha
    const conflicto = await verificarConflictoHorario(id_sala, fecha, hora_inicio, horaFin);
    if (conflicto) {
      return res.status(400).json({
        success: false,
        message: 'Conflicto de horario: Ya existe una función programada en esta sala a esa hora',
        conflicto: {
          pelicula: conflicto.Pelicula.titulo,
          hora_inicio: conflicto.hora_inicio,
          hora_fin: conflicto.hora_fin
        }
      });
    }

    // Crear función
    const nuevaFuncion = await Funcion.create({
      id_pelicula,
      id_sala,
      fecha,
      hora_inicio,
      hora_fin: horaFin,
      precio_base
    });

    // Cargar relaciones para respuesta
    const funcionConDatos = await Funcion.findByPk(nuevaFuncion.id_funcion, {
      include: [
        { model: Pelicula, attributes: ['titulo', 'duracion_minutos', 'genero'] },
        { model: Sala, attributes: ['nombre', 'tipo', 'capacidad'] }
      ]
    });

    logger.info(`Función creada: ${pelicula.titulo} en ${sala.nombre} (${fecha} ${hora_inicio}) por ${req.user.usuario}`);

    res.status(201).json({
      success: true,
      message: 'Función creada exitosamente',
      data: funcionConDatos
    });

  } catch (error) {
    logger.error(`Error al crear función: ${error.message}`);
    next(error);
  }
};

/**
 * Listar funciones
 * Con filtros opcionales: fecha, id_pelicula, id_sala
 */
const listarFunciones = async (req, res, next) => {
  try {
    const { fecha, id_pelicula, id_sala } = req.query;

    const whereClause = {};
    
    // Filtros opcionales
    if (fecha) whereClause.fecha = fecha;
    if (id_pelicula) whereClause.id_pelicula = id_pelicula;
    if (id_sala) whereClause.id_sala = id_sala;

    const funciones = await Funcion.findAll({
      where: whereClause,
      include: [
        { model: Pelicula, attributes: ['titulo', 'duracion_minutos', 'genero', 'clasificacion'] },
        { model: Sala, attributes: ['nombre', 'tipo', 'capacidad'] }
      ],
      order: [['fecha', 'ASC'], ['hora_inicio', 'ASC']]
    });

    res.status(200).json({
      success: true,
      message: 'Funciones obtenidas exitosamente',
      data: funciones,
      count: funciones.length
    });

  } catch (error) {
    logger.error(`Error al listar funciones: ${error.message}`);
    next(error);
  }
};

/**
 * Obtener una función por ID
 */
const obtenerFuncion = async (req, res, next) => {
  try {
    const { id } = req.params;

    const funcion = await Funcion.findByPk(id, {
      include: [
        { model: Pelicula, attributes: ['titulo', 'duracion_minutos', 'genero', 'clasificacion', 'descripcion'] },
        { model: Sala, attributes: ['nombre', 'tipo', 'capacidad'] }
      ]
    });

    if (!funcion) {
      return res.status(404).json({
        success: false,
        message: 'Función no encontrada'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Función obtenida exitosamente',
      data: funcion
    });

  } catch (error) {
    logger.error(`Error al obtener función: ${error.message}`);
    next(error);
  }
};

/**
 * Actualizar una función
 * Solo Admin
 */
const actualizarFuncion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      id_pelicula,
      id_sala,
      fecha,
      hora_inicio,
      precio_base
    } = req.body;

    const funcion = await Funcion.findByPk(id);

    if (!funcion) {
      return res.status(404).json({
        success: false,
        message: 'Función no encontrada'
      });
    }

    // Validar precio_base si se proporciona
    if (precio_base !== undefined && precio_base <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El precio base debe ser mayor a 0'
      });
    }

    let horaFin = funcion.hora_fin;

    // Si se cambia la película o la hora de inicio, recalcular hora_fin
    if (id_pelicula || hora_inicio) {
      const peliculaId = id_pelicula || funcion.id_pelicula;
      const pelicula = await Pelicula.findByPk(peliculaId);
      
      if (!pelicula) {
        return res.status(404).json({
          success: false,
          message: 'Película no encontrada'
        });
      }

      const horaInicioFinal = hora_inicio || funcion.hora_inicio;
      const duracionTotal = pelicula.duracion_minutos + 15;
      horaFin = calcularHoraFin(horaInicioFinal, duracionTotal);
    }

    // Si se cambia sala, verificar que existe y está activa
    if (id_sala) {
      const sala = await Sala.findByPk(id_sala);
      if (!sala) {
        return res.status(404).json({
          success: false,
          message: 'Sala no encontrada'
        });
      }
      if (sala.estado !== 'ACTIVA') {
        return res.status(400).json({
          success: false,
          message: `La sala no está activa (Estado actual: ${sala.estado})`
        });
      }
    }

    // Verificar conflictos de horario (excluyendo la función actual)
    if (id_sala || fecha || hora_inicio) {
      const salaId = id_sala || funcion.id_sala;
      const fechaFinal = fecha || funcion.fecha;
      const horaInicioFinal = hora_inicio || funcion.hora_inicio;

      const conflicto = await verificarConflictoHorario(
        salaId,
        fechaFinal,
        horaInicioFinal,
        horaFin,
        id // Excluir la función actual
      );

      if (conflicto) {
        return res.status(400).json({
          success: false,
          message: 'Conflicto de horario: Ya existe una función programada en esta sala a esa hora',
          conflicto: {
            pelicula: conflicto.Pelicula.titulo,
            hora_inicio: conflicto.hora_inicio,
            hora_fin: conflicto.hora_fin
          }
        });
      }
    }

    // Actualizar campos
    const camposActualizados = {};
    if (id_pelicula !== undefined) camposActualizados.id_pelicula = id_pelicula;
    if (id_sala !== undefined) camposActualizados.id_sala = id_sala;
    if (fecha !== undefined) camposActualizados.fecha = fecha;
    if (hora_inicio !== undefined) camposActualizados.hora_inicio = hora_inicio;
    if (precio_base !== undefined) camposActualizados.precio_base = precio_base;
    if (hora_inicio !== undefined || id_pelicula !== undefined) {
      camposActualizados.hora_fin = horaFin;
    }

    await funcion.update(camposActualizados);

    // Recargar con relaciones
    const funcionActualizada = await Funcion.findByPk(id, {
      include: [
        { model: Pelicula, attributes: ['titulo', 'duracion_minutos', 'genero'] },
        { model: Sala, attributes: ['nombre', 'tipo', 'capacidad'] }
      ]
    });

    logger.info(`Función actualizada: ID ${id} por ${req.user.usuario}`);

    res.status(200).json({
      success: true,
      message: 'Función actualizada exitosamente',
      data: funcionActualizada
    });

  } catch (error) {
    logger.error(`Error al actualizar función: ${error.message}`);
    next(error);
  }
};

/**
 * Eliminar una función
 * Solo Admin
 */
const eliminarFuncion = async (req, res, next) => {
  try {
    const { id } = req.params;

    const funcion = await Funcion.findByPk(id, {
      include: [
        { model: Pelicula, attributes: ['titulo'] },
        { model: Sala, attributes: ['nombre'] }
      ]
    });

    if (!funcion) {
      return res.status(404).json({
        success: false,
        message: 'Función no encontrada'
      });
    }

    // TODO: Verificar si hay ventas asociadas antes de eliminar
    // Por ahora permitimos eliminación directa

    await funcion.destroy();

    logger.info(`Función eliminada: ${funcion.Pelicula.titulo} en ${funcion.Sala.nombre} (ID: ${id}) por ${req.user.usuario}`);

    res.status(200).json({
      success: true,
      message: 'Función eliminada exitosamente'
    });

  } catch (error) {
    logger.error(`Error al eliminar función: ${error.message}`);
    next(error);
  }
};

/**
 * FUNCIONES AUXILIARES
 */

/**
 * Calcula la hora de finalización sumando minutos a hora de inicio
 */
function calcularHoraFin(horaInicio, duracionMinutos) {
  const [horas, minutos] = horaInicio.split(':').map(Number);
  const fecha = new Date(2000, 0, 1, horas, minutos);
  fecha.setMinutes(fecha.getMinutes() + duracionMinutos);
  
  const horasFinales = fecha.getHours().toString().padStart(2, '0');
  const minutosFinales = fecha.getMinutes().toString().padStart(2, '0');
  
  return `${horasFinales}:${minutosFinales}`;
}

/**
 * Verifica si existe conflicto de horario en una sala específica
 */
async function verificarConflictoHorario(idSala, fecha, horaInicio, horaFin, excludeId = null) {
  const whereClause = {
    id_sala: idSala,
    fecha: fecha,
    [Op.or]: [
      // La nueva función inicia durante otra función
      {
        hora_inicio: { [Op.lte]: horaInicio },
        hora_fin: { [Op.gt]: horaInicio }
      },
      // La nueva función termina durante otra función
      {
        hora_inicio: { [Op.lt]: horaFin },
        hora_fin: { [Op.gte]: horaFin }
      },
      // La nueva función contiene completamente otra función
      {
        hora_inicio: { [Op.gte]: horaInicio },
        hora_fin: { [Op.lte]: horaFin }
      }
    ]
  };

  // Excluir la función actual si se está actualizando
  if (excludeId) {
    whereClause.id_funcion = { [Op.ne]: excludeId };
  }

  const funcionConflictiva = await Funcion.findOne({
    where: whereClause,
    include: [{ model: Pelicula, attributes: ['titulo'] }]
  });

  return funcionConflictiva;
}

module.exports = {
  crearFuncion,
  listarFunciones,
  obtenerFuncion,
  actualizarFuncion,
  eliminarFuncion
};
