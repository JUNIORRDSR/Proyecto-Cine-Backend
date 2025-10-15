const { sequelize } = require('../config/database');
const { Sala, Silla, Usuario, Cliente, Pelicula } = require('../models');
const { SEAT_BLOCKS, SEAT_ROWS, SEATS_PER_ROOM } = require('../utils/constants');
const logger = require('../utils/logger');

/**
 * Initialize rooms with all seats
 * Creates 260 seats per room (2 blocks × 13 rows × 10 seats)
 */
const inicializarSalasSillas = async () => {
  try {
    logger.info('Iniciando creación de sillas para todas las salas...');

    const salas = await Sala.findAll();

    if (salas.length === 0) {
      logger.warn('No hay salas en la base de datos');
      return { success: false, message: 'No hay salas disponibles' };
    }

    let totalSillasCreadas = 0;

    for (const sala of salas) {
      logger.info(`Procesando sala: ${sala.nombre}`);

      // Check if room already has seats
      const existingSeats = await Silla.count({ where: { id_sala: sala.id_sala } });
      
      if (existingSeats >= SEATS_PER_ROOM.TOTAL) {
        logger.info(`Sala ${sala.nombre} ya tiene ${existingSeats} sillas. Omitiendo...`);
        continue;
      }

      const sillas = [];

      // Generate seats for each block
      Object.values(SEAT_BLOCKS).forEach((bloque) => {
        SEAT_ROWS.forEach((fila) => {
          for (let numero = 1; numero <= SEATS_PER_ROOM.SEATS_PER_ROW; numero++) {
            sillas.push({
              id_sala: sala.id_sala,
              bloque,
              fila,
              numero,
              tipo: 'NORMAL', // Can be changed for specific seats
            });
          }
        });
      });

      // Bulk create seats
      await Silla.bulkCreate(sillas, { ignoreDuplicates: true });
      totalSillasCreadas += sillas.length;

      logger.info(`✅ Creadas ${sillas.length} sillas para sala ${sala.nombre}`);
    }

    return {
      success: true,
      message: `Se crearon ${totalSillasCreadas} sillas en total`,
      totalSillas: totalSillasCreadas,
    };
  } catch (error) {
    logger.error('Error al inicializar sillas:', error);
    throw error;
  }
};

/**
 * Get seats availability for a specific function
 * @param {number} id_funcion - Function ID
 * @returns {Array} - List of seats with availability status
 */
const getSillasPorFuncion = async (id_funcion) => {
  try {
    const Funcion = require('../models/Funcion');
    const DetalleVenta = require('../models/DetalleVenta');

    // Get function details
    const funcion = await Funcion.findByPk(id_funcion, {
      include: [
        {
          model: Sala,
          as: 'sala',
        },
      ],
    });

    if (!funcion) {
      throw new Error('Función no encontrada');
    }

    // Get all seats in the room
    const todasLasSillas = await Silla.findAll({
      where: { id_sala: funcion.id_sala },
      order: [
        ['bloque', 'ASC'],
        ['fila', 'ASC'],
        ['numero', 'ASC'],
      ],
    });

    // Get occupied/reserved seats for this function
    const detallesVenta = await DetalleVenta.findAll({
      where: { id_funcion },
      include: [
        {
          model: require('../models/Venta'),
          as: 'venta',
          where: {
            estado: ['PAGADA', 'RESERVADA'],
          },
        },
      ],
    });

    // Create a map of occupied seats
    const sillasOcupadas = {};
    detallesVenta.forEach((detalle) => {
      sillasOcupadas[detalle.id_silla] = detalle.estado_silla;
    });

    // Map seats with availability
    const sillasConEstado = todasLasSillas.map((silla) => ({
      id_silla: silla.id_silla,
      bloque: silla.bloque,
      fila: silla.fila,
      numero: silla.numero,
      tipo: silla.tipo,
      estado: sillasOcupadas[silla.id_silla] || 'LIBRE',
    }));

    return sillasConEstado;
  } catch (error) {
    logger.error('Error al obtener sillas por función:', error);
    throw error;
  }
};

/**
 * Check if specific seats are available for a function
 * @param {number} id_funcion - Function ID
 * @param {Array} sillas - Array of {bloque, fila, numero}
 * @returns {boolean} - True if all seats are available
 */
const verificarDisponibilidadSillas = async (id_funcion, sillas) => {
  try {
    const sillasConEstado = await getSillasPorFuncion(id_funcion);

    for (const sillaRequerida of sillas) {
      const sillaEncontrada = sillasConEstado.find(
        (s) =>
          s.bloque === sillaRequerida.bloque &&
          s.fila === sillaRequerida.fila &&
          s.numero === sillaRequerida.numero
      );

      if (!sillaEncontrada) {
        return { available: false, message: `Silla ${sillaRequerida.bloque}-${sillaRequerida.fila}${sillaRequerida.numero} no existe` };
      }

      if (sillaEncontrada.estado !== 'LIBRE') {
        return { available: false, message: `Silla ${sillaRequerida.bloque}-${sillaRequerida.fila}${sillaRequerida.numero} no está disponible` };
      }
    }

    return { available: true, message: 'Todas las sillas están disponibles' };
  } catch (error) {
    logger.error('Error al verificar disponibilidad de sillas:', error);
    throw error;
  }
};

module.exports = {
  inicializarSalasSillas,
  getSillasPorFuncion,
  verificarDisponibilidadSillas,
};
