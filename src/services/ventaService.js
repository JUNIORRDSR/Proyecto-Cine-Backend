const { Venta, DetalleVenta, Silla, Funcion, Pelicula, Sala, Cliente } = require('../models');
const { sequelize } = require('../models');
const logger = require('../utils/logger');
const { SALE_STATES, SEAT_STATES, CLIENT_TYPES } = require('../utils/constants');
const { Op } = require('sequelize');

/**
 * DESCUENTOS
 */
const DESCUENTO_VIP_PORCENTAJE = 10; // 10% de descuento para clientes VIP

/**
 * Crear venta directa (sin reserva previa)
 * Para ventas presenciales en taquilla
 */
const crearVentaDirecta = async (id_cliente, id_funcion, sillasIds, id_usuario) => {
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

    // Calcular subtotal
    let subtotal = funcion.precio_base * sillasIds.length;
    let descuento = 0;
    let total = subtotal;

    // Aplicar descuento si es cliente VIP
    if (cliente.tipo_cliente === CLIENT_TYPES.VIP) {
      descuento = (subtotal * DESCUENTO_VIP_PORCENTAJE) / 100;
      total = subtotal - descuento;
    }

    // Crear venta con estado PAGADA (venta directa)
    const venta = await Venta.create({
      id_cliente,
      id_usuario,
      fecha_venta: new Date(),
      total,
      estado: SALE_STATES.PAGADA,
      expiracion_reserva: null
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

      // Actualizar estado de silla a VENDIDA
      await Silla.update(
        { estado: SEAT_STATES.VENDIDA },
        { where: { id_silla: sillaId }, transaction }
      );
    }

    await transaction.commit();

    logger.info(`Venta directa creada: Venta ${venta.id_venta} - ${sillasIds.length} sillas - Cliente ${cliente.nombre} (${cliente.tipo_cliente}) - Total: $${total} - Usuario: ${id_usuario}`);

    // Retornar venta con detalles
    const ventaCompleta = await Venta.findByPk(venta.id_venta, {
      include: [
        { model: Cliente, attributes: ['nombre', 'email', 'tipo_cliente'] },
        {
          model: DetalleVenta,
          include: [
            { model: Silla, attributes: ['numero_silla', 'fila', 'bloque'] },
            {
              model: Funcion,
              include: [
                { model: Pelicula, attributes: ['titulo', 'duracion_minutos', 'genero'] },
                { model: Sala, attributes: ['nombre', 'tipo'] }
              ]
            }
          ]
        }
      ]
    });

    return {
      venta: ventaCompleta,
      resumen: {
        subtotal,
        descuento,
        descuento_porcentaje: cliente.tipo_cliente === CLIENT_TYPES.VIP ? DESCUENTO_VIP_PORCENTAJE : 0,
        total,
        cantidad_boletos: sillasIds.length
      }
    };

  } catch (error) {
    await transaction.rollback();
    logger.error(`Error al crear venta directa: ${error.message}`);
    throw error;
  }
};

/**
 * Obtener historial de ventas
 */
const obtenerHistorialVentas = async (filtros = {}) => {
  try {
    const { fecha_inicio, fecha_fin, id_cliente, id_usuario, estado } = filtros;

    const whereClause = {};
    
    if (fecha_inicio && fecha_fin) {
      whereClause.fecha_venta = {
        [Op.between]: [new Date(fecha_inicio), new Date(fecha_fin)]
      };
    } else if (fecha_inicio) {
      whereClause.fecha_venta = { [Op.gte]: new Date(fecha_inicio) };
    } else if (fecha_fin) {
      whereClause.fecha_venta = { [Op.lte]: new Date(fecha_fin) };
    }

    if (id_cliente) whereClause.id_cliente = id_cliente;
    if (id_usuario) whereClause.id_usuario = id_usuario;
    if (estado) whereClause.estado = estado;

    const ventas = await Venta.findAll({
      where: whereClause,
      include: [
        { model: Cliente, attributes: ['nombre', 'email', 'tipo_cliente'] },
        {
          model: DetalleVenta,
          include: [
            { model: Silla, attributes: ['numero_silla', 'fila', 'bloque'] },
            {
              model: Funcion,
              attributes: ['fecha', 'hora_inicio'],
              include: [
                { model: Pelicula, attributes: ['titulo'] },
                { model: Sala, attributes: ['nombre'] }
              ]
            }
          ]
        }
      ],
      order: [['fecha_venta', 'DESC']]
    });

    return ventas;

  } catch (error) {
    logger.error(`Error al obtener historial de ventas: ${error.message}`);
    throw error;
  }
};

/**
 * Obtener detalle de una venta específica
 */
const obtenerDetalleVenta = async (id_venta) => {
  try {
    const venta = await Venta.findByPk(id_venta, {
      include: [
        { model: Cliente, attributes: ['nombre', 'email', 'telefono', 'tipo_cliente'] },
        {
          model: DetalleVenta,
          include: [
            { model: Silla, attributes: ['numero_silla', 'fila', 'bloque', 'numero'] },
            {
              model: Funcion,
              attributes: ['fecha', 'hora_inicio', 'hora_fin', 'precio_base'],
              include: [
                { model: Pelicula, attributes: ['titulo', 'duracion_minutos', 'genero', 'clasificacion'] },
                { model: Sala, attributes: ['nombre', 'tipo', 'capacidad'] }
              ]
            }
          ]
        }
      ]
    });

    if (!venta) {
      throw new Error('Venta no encontrada');
    }

    return venta;

  } catch (error) {
    logger.error(`Error al obtener detalle de venta: ${error.message}`);
    throw error;
  }
};

/**
 * Calcular estadísticas de ventas
 */
const obtenerEstadisticasVentas = async (fecha_inicio, fecha_fin) => {
  try {
    const whereClause = {
      estado: SALE_STATES.PAGADA
    };

    if (fecha_inicio && fecha_fin) {
      whereClause.fecha_venta = {
        [Op.between]: [new Date(fecha_inicio), new Date(fecha_fin)]
      };
    }

    const ventas = await Venta.findAll({
      where: whereClause,
      include: [
        { model: Cliente, attributes: ['tipo_cliente'] },
        { model: DetalleVenta }
      ]
    });

    const totalVentas = ventas.length;
    const totalIngresos = ventas.reduce((sum, v) => sum + parseFloat(v.total), 0);
    const totalBoletos = ventas.reduce((sum, v) => sum + v.Detalle_Venta.length, 0);
    
    const ventasVIP = ventas.filter(v => v.Cliente && v.Cliente.tipo_cliente === CLIENT_TYPES.VIP).length;
    const ventasNormal = ventas.filter(v => v.Cliente && v.Cliente.tipo_cliente === CLIENT_TYPES.NORMAL).length;

    const promedioVenta = totalVentas > 0 ? totalIngresos / totalVentas : 0;
    const promedioBoletosPorVenta = totalVentas > 0 ? totalBoletos / totalVentas : 0;

    return {
      total_ventas: totalVentas,
      total_ingresos: totalIngresos.toFixed(2),
      total_boletos: totalBoletos,
      promedio_por_venta: promedioVenta.toFixed(2),
      promedio_boletos_por_venta: promedioBoletosPorVenta.toFixed(2),
      ventas_clientes_vip: ventasVIP,
      ventas_clientes_normal: ventasNormal,
      periodo: {
        fecha_inicio: fecha_inicio || 'Todo el historial',
        fecha_fin: fecha_fin || 'Hasta hoy'
      }
    };

  } catch (error) {
    logger.error(`Error al obtener estadísticas de ventas: ${error.message}`);
    throw error;
  }
};

module.exports = {
  crearVentaDirecta,
  obtenerHistorialVentas,
  obtenerDetalleVenta,
  obtenerEstadisticasVentas,
  DESCUENTO_VIP_PORCENTAJE
};
