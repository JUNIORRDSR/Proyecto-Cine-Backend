const { Venta, DetalleVenta, Silla, Funcion, Pelicula, Sala, Cliente } = require('../models');
const { sequelize } = require('../models');
const logger = require('../utils/logger');
const { SALE_STATES, SEAT_STATES } = require('../utils/constants');
const { Op } = require('sequelize');

/**
 * TIEMPO LÍMITE DE RESERVA: 15 minutos
 */
const RESERVA_TIEMPO_LIMITE_MINUTOS = 15;

/**
 * Crear una reserva
 * Bloquea temporalmente las sillas por 15 minutos
 */
const crearReserva = async (id_cliente, id_funcion, sillasIds, id_usuario) => {
  const transaction = await sequelize.transaction();
  
  try {
    // Validar que la función existe
    const funcion = await Funcion.findByPk(id_funcion, {
      include: [
        { model: Pelicula, attributes: ['titulo'] },
        { model: Sala, attributes: ['nombre'] }
      ]
    });

    if (!funcion) {
      throw new Error('Función no encontrada');
    }

    // Validar que el cliente existe
    const cliente = await Cliente.findByPk(id_cliente);
    if (!cliente) {
      throw new Error('Cliente no encontrado');
    }

    // Validar que se proporcionaron sillas
    if (!sillasIds || sillasIds.length === 0) {
      throw new Error('Debe seleccionar al menos una silla');
    }

    // Verificar disponibilidad de sillas
    const sillas = await Silla.findAll({
      where: {
        id_silla: { [Op.in]: sillasIds }
      },
      transaction
    });

    if (sillas.length !== sillasIds.length) {
      throw new Error('Una o más sillas no existen');
    }

    // Verificar que todas las sillas estén disponibles
    for (const silla of sillas) {
      if (silla.estado !== SEAT_STATES.DISPONIBLE) {
        throw new Error(`La silla ${silla.numero_silla} no está disponible (Estado: ${silla.estado})`);
      }
    }

    // Verificar que no haya reservas/ventas activas para estas sillas en esta función
    const ventasActivas = await DetalleVenta.findAll({
      where: {
        id_funcion,
        id_silla: { [Op.in]: sillasIds }
      },
      include: [{
        model: Venta,
        where: {
          estado: {
            [Op.in]: [SALE_STATES.RESERVADA, SALE_STATES.PAGADA]
          }
        }
      }],
      transaction
    });

    if (ventasActivas.length > 0) {
      const sillasOcupadas = ventasActivas.map(dv => dv.id_silla);
      throw new Error(`Las siguientes sillas ya están reservadas u ocupadas: ${sillasOcupadas.join(', ')}`);
    }

    // Calcular hora de expiración (15 minutos desde ahora)
    const ahora = new Date();
    const expiracion = new Date(ahora.getTime() + RESERVA_TIEMPO_LIMITE_MINUTOS * 60000);

    // Calcular total
    const total = funcion.precio_base * sillasIds.length;

    // Crear venta con estado RESERVADA
    const venta = await Venta.create({
      id_cliente,
      id_usuario,
      fecha_venta: ahora,
      total,
      estado: SALE_STATES.RESERVADA,
      expiracion_reserva: expiracion
    }, { transaction });

    // Crear detalles de venta y actualizar estado de sillas
    const detalles = [];
    for (const sillaId of sillasIds) {
      const detalle = await DetalleVenta.create({
        id_venta: venta.id_venta,
        id_funcion,
        id_silla: sillaId,
        precio_unitario: funcion.precio_base,
        subtotal: funcion.precio_base
      }, { transaction });
      detalles.push(detalle);

      // Actualizar estado de silla a RESERVADA
      await Silla.update(
        { estado: SEAT_STATES.RESERVADA },
        { where: { id_silla: sillaId }, transaction }
      );
    }

    await transaction.commit();

    logger.info(`Reserva creada: Venta ${venta.id_venta} - ${sillasIds.length} sillas - Cliente ${id_cliente} - Expira: ${expiracion}`);

    // Retornar reserva con detalles
    const reservaCompleta = await Venta.findByPk(venta.id_venta, {
      include: [
        { model: Cliente, attributes: ['nombre', 'email', 'tipo_cliente'] },
        {
          model: DetalleVenta,
          include: [
            { model: Silla, attributes: ['numero_silla', 'fila', 'bloque'] },
            {
              model: Funcion,
              include: [
                { model: Pelicula, attributes: ['titulo', 'duracion_minutos'] },
                { model: Sala, attributes: ['nombre', 'tipo'] }
              ]
            }
          ]
        }
      ]
    });

    return reservaCompleta;

  } catch (error) {
    await transaction.rollback();
    logger.error(`Error al crear reserva: ${error.message}`);
    throw error;
  }
};

/**
 * Confirmar reserva (convertirla en venta pagada)
 */
const confirmarReserva = async (id_venta, id_usuario) => {
  const transaction = await sequelize.transaction();

  try {
    // Buscar la venta
    const venta = await Venta.findByPk(id_venta, {
      include: [{ model: DetalleVenta, include: [{ model: Silla }] }]
    });

    if (!venta) {
      throw new Error('Reserva no encontrada');
    }

    // Verificar que está en estado RESERVADA
    if (venta.estado !== SALE_STATES.RESERVADA) {
      throw new Error(`La venta no está en estado RESERVADA (Estado actual: ${venta.estado})`);
    }

    // Verificar que no ha expirado
    const ahora = new Date();
    if (venta.expiracion_reserva && ahora > venta.expiracion_reserva) {
      // Cancelar automáticamente
      await cancelarReserva(id_venta, id_usuario);
      throw new Error('La reserva ha expirado');
    }

    // Cambiar estado a PAGADA
    await venta.update({
      estado: SALE_STATES.PAGADA,
      expiracion_reserva: null
    }, { transaction });

    // Actualizar estado de sillas a VENDIDA
    for (const detalle of venta.Detalle_Venta) {
      await Silla.update(
        { estado: SEAT_STATES.VENDIDA },
        { where: { id_silla: detalle.id_silla }, transaction }
      );
    }

    await transaction.commit();

    logger.info(`Reserva confirmada: Venta ${id_venta} convertida a PAGADA por usuario ${id_usuario}`);

    // Retornar venta actualizada
    const ventaConfirmada = await Venta.findByPk(id_venta, {
      include: [
        { model: Cliente, attributes: ['nombre', 'email', 'tipo_cliente'] },
        {
          model: DetalleVenta,
          include: [
            { model: Silla, attributes: ['numero_silla', 'fila', 'bloque'] },
            {
              model: Funcion,
              include: [
                { model: Pelicula, attributes: ['titulo'] },
                { model: Sala, attributes: ['nombre'] }
              ]
            }
          ]
        }
      ]
    });

    return ventaConfirmada;

  } catch (error) {
    await transaction.rollback();
    logger.error(`Error al confirmar reserva: ${error.message}`);
    throw error;
  }
};

/**
 * Cancelar reserva
 * Libera las sillas reservadas
 */
const cancelarReserva = async (id_venta, id_usuario) => {
  const transaction = await sequelize.transaction();

  try {
    const venta = await Venta.findByPk(id_venta, {
      include: [{ model: DetalleVenta }]
    });

    if (!venta) {
      throw new Error('Reserva no encontrada');
    }

    // Solo se pueden cancelar reservas (no ventas pagadas)
    if (venta.estado === SALE_STATES.PAGADA) {
      throw new Error('No se puede cancelar una venta ya pagada');
    }

    if (venta.estado === SALE_STATES.CANCELADA) {
      throw new Error('La reserva ya está cancelada');
    }

    // Cambiar estado a CANCELADA
    await venta.update({ estado: SALE_STATES.CANCELADA }, { transaction });

    // Liberar sillas (volver a DISPONIBLE)
    for (const detalle of venta.Detalle_Venta) {
      await Silla.update(
        { estado: SEAT_STATES.DISPONIBLE },
        { where: { id_silla: detalle.id_silla }, transaction }
      );
    }

    await transaction.commit();

    logger.info(`Reserva cancelada: Venta ${id_venta} - ${venta.Detalle_Venta.length} sillas liberadas por usuario ${id_usuario || 'sistema'}`);

    return venta;

  } catch (error) {
    await transaction.rollback();
    logger.error(`Error al cancelar reserva: ${error.message}`);
    throw error;
  }
};

/**
 * Limpiar reservas expiradas
 * Job periódico que cancela reservas vencidas
 */
const limpiarReservasExpiradas = async () => {
  try {
    const ahora = new Date();

    // Buscar reservas expiradas
    const reservasExpiradas = await Venta.findAll({
      where: {
        estado: SALE_STATES.RESERVADA,
        expiracion_reserva: {
          [Op.lt]: ahora
        }
      },
      include: [{ model: DetalleVenta }]
    });

    let canceladas = 0;
    for (const reserva of reservasExpiradas) {
      try {
        await cancelarReserva(reserva.id_venta, null);
        canceladas++;
      } catch (error) {
        logger.error(`Error al cancelar reserva expirada ${reserva.id_venta}: ${error.message}`);
      }
    }

    if (canceladas > 0) {
      logger.info(`${canceladas} reservas expiradas han sido canceladas automáticamente`);
    }

    return canceladas;

  } catch (error) {
    logger.error(`Error al limpiar reservas expiradas: ${error.message}`);
    throw error;
  }
};

/**
 * Obtener disponibilidad de sillas para una función
 */
const obtenerDisponibilidadFuncion = async (id_funcion) => {
  try {
    const funcion = await Funcion.findByPk(id_funcion, {
      include: [{ model: Sala }]
    });

    if (!funcion) {
      throw new Error('Función no encontrada');
    }

    // Obtener todas las sillas de la sala
    const sillas = await Silla.findAll({
      where: { id_sala: funcion.id_sala },
      order: [['bloque', 'ASC'], ['fila', 'ASC'], ['numero', 'ASC']]
    });

    // Obtener detalles de venta para esta función (reservadas y vendidas)
    const detallesVenta = await DetalleVenta.findAll({
      where: { id_funcion },
      include: [{
        model: Venta,
        where: {
          estado: {
            [Op.in]: [SALE_STATES.RESERVADA, SALE_STATES.PAGADA]
          }
        }
      }]
    });

    const sillasOcupadas = new Set(detallesVenta.map(dv => dv.id_silla));

    // Marcar disponibilidad
    const disponibilidad = sillas.map(silla => ({
      id_silla: silla.id_silla,
      numero_silla: silla.numero_silla,
      fila: silla.fila,
      bloque: silla.bloque,
      numero: silla.numero,
      estado_real: silla.estado,
      disponible: !sillasOcupadas.has(silla.id_silla) && silla.estado === SEAT_STATES.DISPONIBLE
    }));

    return {
      funcion: {
        id_funcion: funcion.id_funcion,
        fecha: funcion.fecha,
        hora_inicio: funcion.hora_inicio,
        precio_base: funcion.precio_base
      },
      sala: {
        nombre: funcion.Sala.nombre,
        capacidad: funcion.Sala.capacidad
      },
      sillas: disponibilidad,
      disponibles: disponibilidad.filter(s => s.disponible).length,
      ocupadas: sillasOcupadas.size,
      total: sillas.length
    };

  } catch (error) {
    logger.error(`Error al obtener disponibilidad: ${error.message}`);
    throw error;
  }
};

module.exports = {
  crearReserva,
  confirmarReserva,
  cancelarReserva,
  limpiarReservasExpiradas,
  obtenerDisponibilidadFuncion,
  RESERVA_TIEMPO_LIMITE_MINUTOS
};
